/**
 * @typedef {{ readonly input: string, readonly cursor: number }} EditorState
 */

const isSpace = (/** @type {string} */ ch) => /\s/.test(ch)

/**
 * @param {string} input
 * @param {number} cursor
 * @returns {EditorState}
 */
const state = (input, cursor) => ({ input, cursor: Math.min(Math.max(cursor, 0), input.length) })

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const clamp = (s) => state(s.input, s.cursor)

/**
 * @param {string} input
 * @param {number} from
 * @returns {number}
 */
const wordStartBefore = (input, from) => {
    let i = from
    while (i > 0 && isSpace(input[i - 1])) i--
    while (i > 0 && !isSpace(input[i - 1])) i--
    return i
}

/**
 * @param {string} input
 * @param {number} from
 * @returns {number}
 */
const wordEndAfter = (input, from) => {
    let i = from
    while (i < input.length && isSpace(input[i])) i++
    while (i < input.length && !isSpace(input[i])) i++
    return i
}

/**
 * @param {EditorState} s
 * @param {number} start
 * @param {number} end
 * @returns {EditorState}
 */
const removeRange = (s, start, end) => state(s.input.slice(0, start) + s.input.slice(end), start)

/** @returns {EditorState} */
const empty = () => state('', 0)

/**
 * @param {string} text
 * @returns {EditorState}
 */
const fromText = (text) => state(text, text.length)

/**
 * @param {EditorState} s
 * @param {string} text
 * @returns {EditorState}
 */
const insert = (s, text) => {
    const { input, cursor } = clamp(s)
    return state(input.slice(0, cursor) + text + input.slice(cursor), cursor + text.length)
}

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const backspace = (s) => {
    const { cursor } = clamp(s)
    return cursor === 0 ? state(s.input, 0) : removeRange(s, cursor - 1, cursor)
}

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const deleteForward = (s) => {
    const { cursor } = clamp(s)
    return removeRange(s, cursor, cursor + 1)
}

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveLeft = (s) => state(s.input, clamp(s).cursor - 1)

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveRight = (s) => state(s.input, clamp(s).cursor + 1)

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveHome = (s) => state(s.input, 0)

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveEnd = (s) => state(s.input, s.input.length)

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveWordLeft = (s) => state(s.input, wordStartBefore(s.input, clamp(s).cursor))

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const moveWordRight = (s) => state(s.input, wordEndAfter(s.input, clamp(s).cursor))

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const killWord = (s) => {
    const { input, cursor } = clamp(s)
    return removeRange(s, wordStartBefore(input, cursor), cursor)
}

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const killToEnd = (s) => {
    const { input, cursor } = clamp(s)
    return state(input.slice(0, cursor), cursor)
}

/**
 * @param {EditorState} s
 * @returns {EditorState}
 */
const clearLine = (s) => removeRange(s, 0, s.input.length)

export {
    empty,
    fromText,
    insert,
    backspace,
    deleteForward,
    moveLeft,
    moveRight,
    moveHome,
    moveEnd,
    moveWordLeft,
    moveWordRight,
    killWord,
    killToEnd,
    clearLine,
}
