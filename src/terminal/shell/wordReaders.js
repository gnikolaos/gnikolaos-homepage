import { DOUBLE_QUOTE_ESCAPABLE } from './DOUBLE_QUOTE_ESCAPABLE'
import { createToken } from './createToken'

/** @typedef {import('./types').Token} Token */
/** @typedef {import('./types').WordReader} WordReader */

/**
 * @param {number} index
 * @returns {Token}
 */
const createQuoteMark = (index) => createToken('wordPart', index, index + 1, '')

/**
 * @param {string} line
 * @returns {Token}
 */
const createUnclosedQuote = (line) => createToken('unclosedQuote', line.length, line.length, '')

/** @type {WordReader} */
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

/** @type {WordReader} */
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

/** @type {WordReader} */
const readEscaped = (line, start) => {
    if (start + 1 >= line.length) return [createToken('wordPart', start, start + 1, '\\')]
    return [createToken('wordPart', start, start + 2, line[start + 1])]
}

/** @type {Readonly<Record<string, WordReader>>} */
const wordReaders = Object.freeze({
    "'": readSingleQuoted,
    '"': readDoubleQuoted,
    '\\': readEscaped,
})

export { wordReaders }
