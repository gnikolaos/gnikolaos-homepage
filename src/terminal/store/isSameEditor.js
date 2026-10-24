/** @import { EditorState } from '../editor/types' */

/**
 * Tells whether two editor states have the same input and cursor.
 * @param {EditorState} a
 * @param {EditorState} b
 * @returns {boolean}
 */
const isSameEditor = (a, b) => a.input === b.input && a.cursor === b.cursor

export { isSameEditor }
