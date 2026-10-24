import { PARSE_ERROR_MESSAGES } from './PARSE_ERROR_MESSAGES'
import { ParseError } from './ParseError'

/** @import { Stage } from './types' */

/**
 * Creates a builder that collects words into argv lists and argv lists into pipeline stages.
 */
const createStageBuilder = () => {
    /** @type {Stage[]} */
    const stages = []
    /** @type {string[]} */
    let argv = []
    let word = ''
    let inWord = false

    const appendToWord = (/** @type {string} */ text) => {
        word += text
        inWord = true
    }

    const endWord = () => {
        if (inWord) argv.push(word)
        word = ''
        inWord = false
    }

    const endStage = () => {
        endWord()
        if (argv.length === 0) throw new ParseError(PARSE_ERROR_MESSAGES.EMPTY_STAGE)
        stages.push({ argv })
        argv = []
    }

    const finish = () => {
        endWord()
        if (stages.length === 0 && argv.length === 0) return stages
        endStage()
        return stages
    }

    return { appendToWord, endWord, endStage, finish }
}

export { createStageBuilder }
