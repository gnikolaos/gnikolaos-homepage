import { Show } from 'solid-js'
import PromptMarker from './PromptMarker'

/** @typedef {import('../store/terminalStore').PromptStatus} PromptStatus */

/**
 * @param {{ input: string, cursor: number }} props
 */
const InputWithCursor = (props) => {
    const charAtCursor = () => props.input[props.cursor]
    return (
        <>
            {props.input.slice(0, props.cursor)}
            <Show
                when={charAtCursor()}
                fallback={<span class="inline-block h-[1.2em] w-[0.6em] bg-slate-100 align-text-bottom" />}
            >
                <span class="bg-slate-100 text-black">{charAtCursor()}</span>
            </Show>
            {props.input.slice(props.cursor + 1)}
        </>
    )
}

/**
 * @param {{ path: string, status: PromptStatus, input: string, cursor?: number }} props
 */
const Prompt = (props) => (
    <div class="break-all whitespace-pre-wrap">
        <span class="text-blue-400">{props.path}</span> <PromptMarker status={props.status} />{' '}
        <Show when={props.cursor !== undefined} fallback={props.input}>
            <InputWithCursor input={props.input} cursor={/** @type {number} */ (props.cursor)} />
        </Show>
    </div>
)

export default Prompt
