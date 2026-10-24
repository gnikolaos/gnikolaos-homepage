/** @typedef {{ argv: string[] }} Stage */
/** @typedef {{ pipeline: Stage[] }} ParsedLine */

class ParseError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message)
        this.name = 'ParseError'
    }
}

const PIPE_ERROR = 'parse error near `|`'
const DOUBLE_QUOTE_ESCAPABLE = new Set(['"', '\\'])

/**
 * @param {string} line
 * @param {number} start index of the opening quote
 * @returns {{ text: string, end: number }} end is the index after the closing quote
 */
const readSingleQuoted = (line, start) => {
    const close = line.indexOf("'", start + 1)
    if (close === -1) throw new ParseError('unmatched quote')
    return { text: line.slice(start + 1, close), end: close + 1 }
}

/**
 * @param {string} line
 * @param {number} start index of the opening quote
 * @returns {{ text: string, end: number }} end is the index after the closing quote
 */
const readDoubleQuoted = (line, start) => {
    let text = ''
    let i = start + 1
    while (i < line.length) {
        const char = line[i]
        if (char === '"') return { text, end: i + 1 }
        if (char === '\\' && DOUBLE_QUOTE_ESCAPABLE.has(line[i + 1])) {
            text += line[i + 1]
            i += 2
            continue
        }
        text += char
        i += 1
    }
    throw new ParseError('unmatched quote')
}

/**
 * @param {string} line
 * @param {number} start index of the backslash
 * @returns {{ text: string, end: number }}
 */
const readEscaped = (line, start) => {
    if (start + 1 >= line.length) return { text: '\\', end: start + 1 }
    return { text: line[start + 1], end: start + 2 }
}

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
        if (argv.length === 0) throw new ParseError(PIPE_ERROR)
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

/** @type {Record<string, (line: string, start: number) => { text: string, end: number }>} */
const wordReaders = {
    "'": readSingleQuoted,
    '"': readDoubleQuoted,
    '\\': readEscaped,
}

/**
 * @param {string} line
 * @returns {ParsedLine}
 */
const parse = (line) => {
    const builder = createStageBuilder()
    let i = 0
    while (i < line.length) {
        const char = line[i]
        const reader = wordReaders[char]
        if (reader) {
            const { text, end } = reader(line, i)
            builder.appendToWord(text)
            i = end
            continue
        }
        if (char === '|') builder.endStage()
        else if (/\s/.test(char)) builder.endWord()
        else builder.appendToWord(char)
        i += 1
    }
    return { pipeline: builder.finish() }
}

export { parse, ParseError }
