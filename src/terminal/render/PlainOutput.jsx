import { createMemo, Index, Show } from 'solid-js'
import { isStyledSpan } from '../shell/isStyledSpan'
import { parseAnsi } from '../shell/parseAnsi'
import { resolveSpanClass } from './resolveSpanClass'

/**
 * Renders plain command output, styling its ANSI spans.
 * @param {{ content: string }} props
 */
const PlainOutput = (props) => {
    const spans = createMemo(() => parseAnsi(props.content))
    return (
        <pre class="font-meslo selectable-text break-words whitespace-pre-wrap">
            <Index each={spans()}>
                {(span) => (
                    <Show when={isStyledSpan(span())} fallback={span().text}>
                        <span class={resolveSpanClass(span())}>{span().text}</span>
                    </Show>
                )}
            </Index>
        </pre>
    )
}

export default PlainOutput
