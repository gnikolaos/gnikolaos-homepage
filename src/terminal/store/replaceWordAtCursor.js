import { insert } from '../editor/insert'

/** @import { EditorState } from '../editor/types' */
/** @import { Completion } from '../shell/types' */

/**
 * Replaces the completion's word range in the editor input and puts the cursor after the replacement.
 * @param {EditorState} editor
 * @param {Completion} completion
 * @param {string} replacement
 * @returns {EditorState}
 */
const replaceWordAtCursor = ({ input }, { start, end }, replacement) =>
    insert({ input: input.slice(0, start) + input.slice(end), cursor: start }, replacement)

export { replaceWordAtCursor }
