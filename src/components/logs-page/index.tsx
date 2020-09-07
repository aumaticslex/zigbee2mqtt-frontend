import { Component, ComponentChild, h } from "preact";
import { connect } from "unistore/preact";
import actions, { Actions } from "../../actions";
import { GlobalState } from "../../store";
import cx from "classnames";

// eslint-disable-next-line react/prefer-stateless-function
export class LogsPage extends Component<Actions & GlobalState, {}> {
    render(): ComponentChild {
        const { logs } = this.props;
        return <div class="container-fluid">{
            logs.map(l => <pre class={cx("pre-scrollable mb-0", {
                'text-danger': l.level === 'error',
                'text-warning': l.level === 'warning',
                'text-info': l.level === 'info'
            })} >{l.level.toUpperCase()}: <code>{l.message}</code></pre>)
        }</div>
    }
}

const mappedProps = ["logs", "forceRender"];

export default connect<{}, {}, GlobalState, Actions>(mappedProps, actions)(LogsPage);