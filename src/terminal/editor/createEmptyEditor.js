import { createEditorState } from './createEditorState'

/**
 * Creates an editor with blank input and the cursor at 0.
 * @returns {import('./types').EditorState}
 */
const createEmptyEditor = () => createEditorState('', 0)

export { createEmptyEditor }
