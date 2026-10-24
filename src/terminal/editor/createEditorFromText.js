import { createEditorState } from './createEditorState'

/** @import { EditorState } from './types' */

/**
 * Creates an editor holding `text` with the cursor at its end.
 * @param {string} text
 * @returns {EditorState}
 */
const createEditorFromText = (text) => createEditorState(text, text.length)

export { createEditorFromText }
