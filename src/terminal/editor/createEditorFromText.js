import { createEditorState } from './createEditorState'

/**
 * Creates an editor holding `text` with the cursor at its end.
 * @param {string} text
 * @returns {import('./types').EditorState}
 */
const createEditorFromText = (text) => createEditorState(text, text.length)

export { createEditorFromText }
