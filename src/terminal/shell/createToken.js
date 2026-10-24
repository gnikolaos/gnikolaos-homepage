/** @import { Token, TokenKind } from './types' */

/**
 * Creates a token covering the raw chars from `start` up to `end`.
 * @param {TokenKind} kind
 * @param {number} start
 * @param {number} end
 * @param {string} text
 * @returns {Token}
 */
const createToken = (kind, start, end, text) => ({ kind, start, end, text })

export { createToken }
