import { clampCursor } from './clampCursor'
import { createEditorState } from './createEditorState'

/** @import { EditorState } from './types' */

const isWhitespace = (/** @type {string} */ char) => /\s/.test(char)

/**
 * @param {string} input
 * @param {number} from
 * @returns {number}
 */
const findWordStartBefore = (input, from) => {
    let i = from
    while (i > 0 && isWhitespace(input[i - 1])) i--
    while (i > 0 && !isWhitespace(input[i - 1])) i--
    return i
}

/**
 * @param {string} input
 * @param {number} from
 * @returns {number}
 */
const findWordEndAfter = (input, from) => {
    let i = from
    while (i < input.length && isWhitespace(input[i])) i++
    while (i < input.length && !isWhitespace(input[i])) i++
    return i
}

/**
 * @param {EditorState} editor
 * @param {number} start
 * @param {number} end
 * @returns {EditorState}
 */
const removeRange = (editor, start, end) =>
    createEditorState(editor.input.slice(0, start) + editor.input.slice(end), start)

const lineEditor = Object.freeze({
    /**
     * Deletes the character before the cursor.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    backspace: (editor) => {
        const { cursor } = clampCursor(editor)
        return cursor === 0 ? createEditorState(editor.input, 0) : removeRange(editor, cursor - 1, cursor)
    },

    /**
     * Deletes the character under the cursor.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    deleteForward: (editor) => {
        const { cursor } = clampCursor(editor)
        return removeRange(editor, cursor, cursor + 1)
    },

    /**
     * Moves the cursor one character left.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveLeft: (editor) => createEditorState(editor.input, clampCursor(editor).cursor - 1),

    /**
     * Moves the cursor one character right.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveRight: (editor) => createEditorState(editor.input, clampCursor(editor).cursor + 1),

    /**
     * Moves the cursor to the start of the line.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveHome: (editor) => createEditorState(editor.input, 0),

    /**
     * Moves the cursor to the end of the line.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveEnd: (editor) => createEditorState(editor.input, editor.input.length),

    /**
     * Moves the cursor to the start of the word before it.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveWordLeft: (editor) =>
        createEditorState(editor.input, findWordStartBefore(editor.input, clampCursor(editor).cursor)),

    /**
     * Moves the cursor to the end of the word after it.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    moveWordRight: (editor) =>
        createEditorState(editor.input, findWordEndAfter(editor.input, clampCursor(editor).cursor)),

    /**
     * Deletes from the start of the word before the cursor up to the cursor.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    killWord: (editor) => {
        const { input, cursor } = clampCursor(editor)
        return removeRange(editor, findWordStartBefore(input, cursor), cursor)
    },

    /**
     * Deletes the whole line.
     * @param {EditorState} editor
     * @returns {EditorState}
     */
    clearLine: (editor) => removeRange(editor, 0, editor.input.length),
})

export { lineEditor }
