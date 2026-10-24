import { Show } from 'solid-js'
import InputWithCursor from './InputWithCursor'
import PromptMarker from './PromptMarker'
import SearchLine from './SearchLine'

/** @typedef {import('../store/types').PromptStatus} PromptStatus */
/** @typedef {import('../store/types').SearchState} SearchState */

/**
 * Renders a prompt line with its path, marker and input, and the search line while searching.
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
