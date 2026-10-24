import { createEditorState } from './createEditorState'

/** @import { EditorState } from './types' */

/**
 * Returns the editor with its cursor clamped into the input.
 * @param {EditorState} editor
 * @returns {EditorState}
 */
const clampCursor = (editor) => createEditorState(editor.input, editor.cursor)

export { clampCursor }
