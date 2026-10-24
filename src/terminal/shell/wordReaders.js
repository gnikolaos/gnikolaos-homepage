import { createToken } from './createToken'

/** @import { Token, WordReader } from './types' */

const DOUBLE_QUOTE_ESCAPABLE = new Set(['"', '\\'])

/**
 * Creates the empty word part that marks a quote character at index.
 * @param {number} index
 * @returns {Token}
 */
const createQuoteMark = (index) => createToken('wordPart', index, index + 1, '')

/**
 * Creates the marker token for a quote left open at the end of the line.
 * @param {string} line
 * @returns {Token}
 */
const createUnclosedQuote = (line) => createToken('unclosedQuote', line.length, line.length, '')

/**
 * Reads a single-quoted string literally, up to the closing quote or the unclosed-quote marker.
 * @type {WordReader}
 */
const readSingleQuoted = (line, start) => {
    const close = line.indexOf("'", start + 1)
    const contentEnd = close === -1 ? line.length : close
    const tokens = [createQuoteMark(start)]
    for (let index = start + 1; index < contentEnd; index += 1) {
        tokens.push(createToken('wordPart', index, index + 1, line[index]))
    }
    tokens.push(close === -1 ? createUnclosedQuote(line) : createQuoteMark(close))
    return tokens
}

/**
 * Reads a double-quoted string, unescaping `\"` and `\\`, up to the closing quote or the unclosed-quote marker.
 * @type {WordReader}
 */
const readDoubleQuoted = (line, start) => {
    const tokens = [createQuoteMark(start)]
    let index = start + 1
    while (index < line.length) {
        const char = line[index]
        if (char === '"') return [...tokens, createQuoteMark(index)]
        const isEscape = char === '\\' && DOUBLE_QUOTE_ESCAPABLE.has(line[index + 1])
        const part = isEscape
            ? createToken('wordPart', index, index + 2, line[index + 1])
            : createToken('wordPart', index, index + 1, char)
        tokens.push(part)
        index = part.end
    }
    return [...tokens, createUnclosedQuote(line)]
}

/**
 * Reads a backslash escape as the next character, or a literal backslash at the end of the line.
 * @type {WordReader}
 */
const readEscaped = (line, start) => {
    if (start + 1 >= line.length) return [createToken('wordPart', start, start + 1, '\\')]
    return [createToken('wordPart', start, start + 2, line[start + 1])]
}

/**
 * Maps each character that opens a quoted or escaped word part to its reader.
 * @type {Readonly<Record<string, WordReader>>}
 */
const wordReaders = Object.freeze({
    "'": readSingleQuoted,
    '"': readDoubleQuoted,
    '\\': readEscaped,
})

export { wordReaders }
