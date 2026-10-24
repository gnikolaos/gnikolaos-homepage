/** @import { EditorState } from './types' */

/**
 * Creates an editor state with the cursor clamped into the input.
 * @param {string} input
 * @param {number} cursor
 * @returns {EditorState}
 */
const createEditorState = (input, cursor) => ({ input, cursor: Math.min(Math.max(cursor, 0), input.length) })

export { createEditorState }
