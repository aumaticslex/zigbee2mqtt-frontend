import { Component, ComponentChild, createRef, h, RefObject } from "preact";


import { drag } from "d3-drag";
import { Simulation } from "d3-force";
import { event, select, selectAll } from "d3-selection";
import { LinkI, NodeI } from "./types";
import cx from "classnames";

import * as style from "./map.css";
import { MouseEventsResponderNode } from ".";
import { TimedProps, TimeInfo } from "../time";
import { Device } from "../../types";
import { genDeviceImageUrl } from "../../utils";

const calcStarPoints = (
    centerX: number,
    centerY: number,
    innerCircleArms: number,
    innerRadius: number,
    outerRadius: number
): string => {
    const angle = Math.PI / innerCircleArms;
    const angleOffsetToCenterStar = 60;
    const totalArms = innerCircleArms * 2;
    let points = "";
    for (let i = 0; i < totalArms; i++) {
        const isEvenIndex = i % 2 == 0;
        const r = isEvenIndex ? outerRadius : innerRadius;
        const currX = centerX + Math.cos(i * angle + angleOffsetToCenterStar) * r;
        const currY = centerY + Math.sin(i * angle + angleOffsetToCenterStar) * r;
        points += `${currX}, ${currY} `;
    }
    return points;
};


const getStarShape = (innerCircleArms: number, styleStarWidth: number, innerOuterRadiusRatio: number): string => {
    return calcStarPoints(
        15,
        15,
        innerCircleArms,
        styleStarWidth,
        innerOuterRadiusRatio
    );
};

interface NodeProps extends MouseEventsResponderNode, TimedProps {
    node: NodeI;
}

const offlineTimeout = 3600 * 2;

export const isOnline = (device: Device, timeInfo: TimeInfo | undefined): boolean => {
    if (!timeInfo || !device.last_seen) {
        return true;
    }
    return timeInfo.ts - parseInt(device.last_seen, 10) < offlineTimeout;
};

interface NodeState {
    imgUrl: string;
}
class Node extends Component<NodeProps, NodeState> {
    ref = createRef<SVGPolygonElement | SVGCircleElement | SVGImageElement>();
    state = {
        imgUrl: ""
    }

    componentDidMount(): void {
        const { current } = this.ref;
        const { node } = this.props;

        select(current as SVGElement).data([node]);

        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({
            imgUrl: genDeviceImageUrl(node.device)
        })
    }


    onMouseOut = (): void => {
        const { node, onMouseOut } = this.props;
        onMouseOut && onMouseOut(node);
    };

    onMouseOver = (): void => {
        const { node, onMouseOver } = this.props;
        onMouseOver && onMouseOver(node);
    };

    onDblClick = (): void => {
        const { node, onDblClick } = this.props;
        onDblClick && onDblClick(node);
    };


    onImageError = (): void => {
        this.setState({
            imgUrl: "https://raw.githubusercontent.com/slsys/Gateway/master/devices/png/generic-zigbee-device.png"
        })
    };

    render(): ComponentChild {
        const { imgUrl } = this.state;
        const { node, time } = this.props;
        const { onMouseOver, onMouseOut, onDblClick, onImageError } = this;
        const deviceType = (node.device as Device).type as string;
        const cn = cx(style.node, style[deviceType], { [style.offline]: !isOnline(node.device, time) });

        if (node.device.type === "Coordinator") {
            return (
                <polygon
                    className={cn}
                    ref={this.ref as RefObject<SVGPolygonElement>}
                    points={getStarShape(5, 5, 14) as string}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onDblClick={onDblClick}
                />
            );
        } else {
            return (
                <image
                    onError={onImageError}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onDblClick={onDblClick}
                    className={`${style.img} ${cn}`}
                    ref={this.ref as RefObject<SVGImageElement>}
                    href={imgUrl}
                />);
        }
    }
}

interface NodesProps extends MouseEventsResponderNode, TimedProps {
    nodes: NodeI[];
    simulation: Simulation<NodeI, LinkI>;
}

interface NodesState {
    tooltipNode: NodeI | undefined;
}

export default class Nodes extends Component<NodesProps, NodesState> {
    updateDrag(): void {
        const { simulation } = this.props;
        const dragForce = drag<SVGCircleElement, NodeI>()
            .on("start", d => {
                if (!event.active) {
                    simulation.alphaTarget(0.3).restart();
                }
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", d => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", d => {
                if (!event.active) {
                    simulation.alphaTarget(0);
                }
                d.fx = undefined;
                d.fy = undefined;
            });


        selectAll<SVGCircleElement, NodeI>(`.${style.node}`)
            .call(dragForce);
    }

    componentDidMount(): void {
        this.updateDrag();
    }

    componentDidUpdate(): void {
        this.updateDrag();
    }

    render(): ComponentChild {
        const { nodes, onMouseOut, onMouseOver, onDblClick, time } = this.props;
        return (
            <g className={style.nodes}>
                {nodes.map((node: NodeI, index: number) => (
                    <Node
                        time={time}
                        onMouseOut={onMouseOut}
                        onMouseOver={onMouseOver}
                        onDblClick={onDblClick}
                        key={index}
                        node={node}
                    />
                ))}
            </g>
        );
    }
}
