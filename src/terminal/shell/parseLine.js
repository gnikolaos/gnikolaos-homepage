import { PARSE_ERROR_MESSAGES } from './PARSE_ERROR_MESSAGES'
import { ParseError } from './ParseError'
import { createStageBuilder } from './createStageBuilder'
import { tokenizeLine } from './tokenizeLine'

/** @typedef {import('./types').ParsedLine} ParsedLine */
/** @typedef {import('./types').Token} Token */
/** @typedef {import('./types').TokenKind} TokenKind */
/** @typedef {ReturnType<typeof createStageBuilder>} StageBuilder */

/** @type {Readonly<Record<TokenKind, (builder: StageBuilder, token: Token) => void>>} */
const tokenHandlers = Object.freeze({
    wordPart: (builder, token) => builder.appendToWord(token.text),
    wordBreak: (builder) => builder.endWord(),
    stageBreak: (builder) => builder.endStage(),
    unclosedQuote: () => {
        throw new ParseError(PARSE_ERROR_MESSAGES.UNMATCHED_QUOTE)
    },
})

/**
 * Parses a shell line into a pipeline of argv stages, throwing ParseError on empty stages and open quotes.
 * @param {string} line
 * @returns {ParsedLine}
 */
const parseLine = (line) => {
    const builder = createStageBuilder()
    for (const token of tokenizeLine(line)) tokenHandlers[token.kind](builder, token)
    return { pipeline: builder.finish() }
}

export { parseLine }
