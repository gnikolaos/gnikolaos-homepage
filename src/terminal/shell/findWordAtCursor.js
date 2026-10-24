import { tokenizeLine } from './tokenizeLine'

/** @import { Token, WordAtCursor } from './types' */

/**
 * @param {string} input
 * @param {Token} part
 * @param {number} cursor
 * @returns {string}
 */
const readPartBeforeCursor = (input, part, cursor) => (part.end <= cursor ? part.text : input.slice(part.start, cursor))

/**
 * Finds the word under the cursor, its unescaped text up to the cursor, and the command of its pipeline stage.
 * @param {string} input
 * @param {number} cursor
 * @returns {WordAtCursor}
 */
const findWordAtCursor = (input, cursor) => {
    let start = 0
    let word = ''
    let inWord = false
    /** @type {string | null} */
    let command = null

    for (const token of tokenizeLine(input)) {
        if (token.kind === 'unclosedQuote') continue
        if (token.kind === 'wordPart') {
            if (token.start >= cursor) continue
            word += readPartBeforeCursor(input, token, cursor)
            inWord = true
            continue
        }
        if (token.start >= cursor) return { start, end: token.start, word, command }
        if (inWord && command === null) command = word
        if (token.kind === 'stageBreak') command = null
        start = token.end
        word = ''
        inWord = false
    }
    return { start, end: input.length, word, command }
}

export { findWordAtCursor }
