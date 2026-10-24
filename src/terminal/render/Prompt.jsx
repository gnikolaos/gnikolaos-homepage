import { Show } from 'solid-js'
import PromptMarker from './PromptMarker'

/** @typedef {import('../store/terminalStore').PromptStatus} PromptStatus */
/** @typedef {import('../store/terminalStore').SearchState} SearchState */

/**
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

/**
 * @param {{ search: SearchState }} props
 */
const SearchLine = (props) => {
    const failing = () => props.search.query !== '' && props.search.index === null
    return (
        <div class="break-all whitespace-pre-wrap text-slate-400">
            {failing() ? 'failing ' : ''}bck-i-search: {props.search.query}_
        </div>
    )
}

/**
 * @param {{
 *     path: string,
 *     status: PromptStatus,
 *     running: boolean,
 *     input: string,
 *     cursor?: number,
 *     search?: SearchState | null,
 * }} props
 */
const Prompt = (props) => {
    const matchLength = () => (props.search && props.search.index !== null ? props.search.query.length : 0)
    return (
        <>
            <div class="break-all whitespace-pre-wrap">
                <span class="text-blue-400">{props.path}</span>{' '}
                <PromptMarker status={props.status} running={props.running} />{' '}
                <Show when={props.cursor !== undefined} fallback={props.input}>
                    <InputWithCursor
                        input={props.input}
                        cursor={/** @type {number} */ (props.cursor)}
                        matchLength={matchLength()}
                    />
                </Show>
            </div>
            <Show when={props.search}>
                <SearchLine search={/** @type {SearchState} */ (props.search)} />
            </Show>
        </>
    )
}

export default Prompt
