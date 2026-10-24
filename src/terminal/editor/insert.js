import { clampCursor } from './clampCursor'
import { createEditorState } from './createEditorState'

/** @import { EditorState } from './types' */

/**
 * Inserts `text` at the cursor and moves the cursor past it.
 * @param {EditorState} editor
 * @param {string} text
 * @returns {EditorState}
 */
const insert = (editor, text) => {
    const { input, cursor } = clampCursor(editor)
    return createEditorState(input.slice(0, cursor) + text + input.slice(cursor), cursor + text.length)
}

export { insert }
