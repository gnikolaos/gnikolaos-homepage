import { Show } from 'solid-js'

/**
 * Renders the prompt input with a block cursor and the search match underlined before it.
 * @param {{ input: string, cursor: number, matchLength: number }} props
 */
const InputWithCursor = (props) => {
    const matchStart = () => props.cursor - props.matchLength
    const charAtCursor = () => props.input[props.cursor]
    return (
        <>
            {props.input.slice(0, matchStart())}
            <Show when={props.matchLength > 0}>
                <span class="underline decoration-yellow-400">{props.input.slice(matchStart(), props.cursor)}</span>
            </Show>
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

export default InputWithCursor
