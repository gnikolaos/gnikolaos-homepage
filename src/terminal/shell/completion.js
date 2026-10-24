import { isFsError } from '../fs/FsError'

/** @typedef {import('./registry').Registry} Registry */
/** @typedef {import('./registry').CompletionKind} CompletionKind */
/** @typedef {import('../fs/vfs').Vfs} Vfs */
/** @typedef {{ start: number, end: number, candidates: string[] }} Completion */

/**
 * @typedef {object} WordAtCursor
 * @property {number} start
 * @property {number} end
 * @property {string} word        unescaped text between start and the cursor
 * @property {string | null} command   first word of the current stage, null when the word itself is the first
 */

const DOUBLE_QUOTE_ESCAPABLE = new Set(['"', '\\'])

/**
 * @param {string} char
 * @returns {boolean}
 */
const isSeparator = (char) => char === '|' || /\s/.test(char)

/**
 * @param {string} input
 * @param {number} i index of a backslash
 * @param {string | null} quote
 * @returns {boolean}
 */
const startsEscape = (input, i, quote) => {
    if (quote === "'" || i + 1 >= input.length) return false
    return quote === null || DOUBLE_QUOTE_ESCAPABLE.has(input[i + 1])
}

/**
 * @param {string} input
 * @param {number} cursor
 * @returns {WordAtCursor}
 */
const findWordAtCursor = (input, cursor) => {
    /** @type {string | null} */
    let quote = null
    let escaped = false
    let word = ''
    let inWord = false
    let start = 0
    /** @type {string | null} */
    let firstWord = null

    const append = (/** @type {string} */ text) => {
        word += text
        inWord = true
    }

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i]
        const beforeCursor = i < cursor
        if (escaped) {
            escaped = false
            if (beforeCursor) append(char)
        } else if (char === '\\' && startsEscape(input, i, quote)) {
            escaped = true
            if (beforeCursor && i + 1 >= cursor) append(char)
        } else if (quote !== null) {
            if (char === quote) quote = null
            else if (beforeCursor) append(char)
        } else if (char === "'" || char === '"') {
            quote = char
            if (beforeCursor) inWord = true
        } else if (!isSeparator(char)) {
            if (beforeCursor) append(char)
        } else if (!beforeCursor) {
            return { start, end: i, word, command: firstWord }
        } else {
            if (inWord && firstWord === null) firstWord = word
            if (char === '|') firstWord = null
            word = ''
            inWord = false
            start = i + 1
        }
    }
    return { start, end: input.length, word, command: firstWord }
}

/**
 * @param {string[]} names
 * @returns {string[]}
 */
const sortUnique = (names) => [...new Set(names)].sort((a, b) => a.localeCompare(b))

/**
 * @param {string} word
 * @returns {string}
 */
const escapeWord = (word) => word.replace(/[\s'"\\|]/g, '\\$&')

/**
 * @param {string[]} words
 * @returns {string}
 */
const commonPrefix = (words) => {
    if (words.length === 0) return ''
    let prefix = words[0]
    for (const word of words.slice(1)) {
        let length = 0
        while (length < prefix.length && prefix[length] === word[length]) length += 1
        prefix = prefix.slice(0, length)
    }
    return prefix
}

/**
 * @param {string} candidate
 * @returns {string}
 */
const displayName = (candidate) => {
    const isDir = candidate.endsWith('/')
    const path = isDir ? candidate.slice(0, -1) : candidate
    const name = path.slice(path.lastIndexOf('/') + 1)
    return isDir ? name + '/' : name
}

/**
 * @param {{ fs: Vfs, registry: Registry, getCwd: () => string }} deps
 * @returns {(input: string, cursor: number) => Promise<Completion>}
 */
const createCompleter = ({ fs, registry, getCwd }) => {
    /**
     * @param {string} prefix
     * @returns {string[]}
     */
    const completeCommands = (prefix) =>
        sortUnique(
            registry
                .list({ includeHidden: true })
                .map((command) => command.name)
                .filter((name) => name.startsWith(prefix)),
        )

    /**
     * @param {string} dirPath
     * @returns {Promise<import('../fs/vfs').Entry[]>}
     */
    const listDir = async (dirPath) => {
        try {
            return await fs.readdir(fs.resolve(getCwd(), dirPath))
        } catch (error) {
            if (isFsError(error)) return []
            throw error
        }
    }

    /**
     * @param {string} word
     * @param {boolean} dirsOnly
     * @returns {Promise<string[]>}
     */
    const completePaths = async (word, dirsOnly) => {
        if (word === '~') return ['~/']
        const dirPart = word.slice(0, word.lastIndexOf('/') + 1)
        const namePart = word.slice(dirPart.length)
        const showHidden = namePart.startsWith('.')
        const entries = await listDir(dirPart || '.')
        return sortUnique(
            entries
                .filter((entry) => entry.name.startsWith(namePart))
                .filter((entry) => showHidden || !entry.name.startsWith('.'))
                .filter((entry) => !dirsOnly || entry.type === 'dir')
                .map((entry) => dirPart + entry.name + (entry.type === 'dir' ? '/' : '')),
        )
    }

    /**
     * @param {CompletionKind | undefined} kind
     * @param {string} word
     * @returns {Promise<string[]>}
     */
    const completeArgument = async (kind, word) => {
        if (kind === 'paths' || kind === 'dirs') return completePaths(word, kind === 'dirs')
        if (kind === 'commands') return completeCommands(word)
        return []
    }

    return async (input, cursor) => {
        const { start, end, word, command } = findWordAtCursor(input, cursor)
        const candidates =
            command === null ? completeCommands(word) : await completeArgument(registry.get(command)?.complete, word)
        return { start, end, candidates }
    }
}

export { createCompleter, findWordAtCursor, escapeWord, commonPrefix, displayName }
