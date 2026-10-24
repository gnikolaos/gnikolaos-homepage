import { createEditorState } from './createEditorState'

/** @import { EditorState } from './types' */

/**
 * Creates an editor with blank input and the cursor at 0.
 * @returns {EditorState}
 */
const createEmptyEditor = () => createEditorState('', 0)

export { createEmptyEditor }
