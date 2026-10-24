import { createMemo, Index, Show } from 'solid-js'
import { isStyled } from '../shell/isStyled'
import { parseAnsi } from '../shell/parseAnsi'
import { resolveSpanClass } from './resolveSpanClass'
import { SELECTABLE_CLASS } from './SELECTABLE_CLASS'

/**
 * Renders plain command output, styling its ANSI spans.
 * @param {{ content: string }} props
 */
const PlainOutput = (props) => {
    const spans = createMemo(() => parseAnsi(props.content))
    return (
        <pre class={`font-meslo break-words whitespace-pre-wrap ${SELECTABLE_CLASS}`}>
            <Index each={spans()}>
                {(span) => (
                    <Show when={isStyled(span())} fallback={span().text}>
                        <span class={resolveSpanClass(span())}>{span().text}</span>
                    </Show>
                )}
            </Index>
        </pre>
    )
}

export default PlainOutput
