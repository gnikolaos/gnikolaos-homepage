import { createToken } from './createToken'
import { wordReaders } from './wordReaders'

/** @import { Token, TokenKind, WordReader } from './types' */

/**
 * @param {string} char
 * @returns {TokenKind}
 */
const classifyPlainChar = (char) => {
    if (char === '|') return 'stageBreak'
    if (/\s/.test(char)) return 'wordBreak'
    return 'wordPart'
}

/** @type {WordReader} */
const readPlainChar = (line, start) => [createToken(classifyPlainChar(line[start]), start, start + 1, line[start])]

/**
 * Splits a shell line into word parts, word breaks and stage breaks, then unclosedQuote if a quote stays open.
 * @param {string} line
 * @returns {Token[]}
 */
const tokenizeLine = (line) => {
    /** @type {Token[]} */
    const tokens = []
    let index = 0
    while (index < line.length) {
        const readWord = wordReaders[line[index]] ?? readPlainChar
        const wordTokens = readWord(line, index)
        tokens.push(...wordTokens)
        index = wordTokens[wordTokens.length - 1].end
    }
    return tokens
}

export { tokenizeLine }
