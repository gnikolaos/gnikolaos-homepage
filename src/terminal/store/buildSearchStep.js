import { createEditorFromText } from '../editor/createEditorFromText'
import { searchHistory } from '../history/searchHistory'

/** @import { EditorState } from '../editor/types' */
/** @import { SearchState } from './types' */

/**
 * Builds the search state and editor for a reverse history search from `fromIndex`, falling back to the draft.
 * @param {readonly string[]} entries
 * @param {string} draft
 * @param {string} query
 * @param {number} fromIndex
 * @returns {{ search: SearchState, editor: EditorState }}
 */
const buildSearchStep = (entries, draft, query, fromIndex) => {
    const index = searchHistory(entries, query, fromIndex)
    if (index === null) return { search: { query, index, draft }, editor: createEditorFromText(draft) }
    const entry = entries[index]
    return {
        search: { query, index, draft },
        editor: { input: entry, cursor: entry.lastIndexOf(query) + query.length },
    }
}

export { buildSearchStep }
