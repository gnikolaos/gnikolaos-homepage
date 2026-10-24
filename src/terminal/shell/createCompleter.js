import { isFsError } from '../fs/isFsError'
import { findWordAtCursor } from './findWordAtCursor'

/** @import { Entry, Vfs } from '../fs/types' */
/** @import { Completion, CompletionKind, Registry } from './types' */

/**
 * @param {string[]} names
 * @returns {string[]}
 */
const sortUnique = (names) => [...new Set(names)].sort((a, b) => a.localeCompare(b))

/**
 * Creates a completer that offers command names for the first word of a stage and argument candidates after it.
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
     * @returns {Promise<Entry[]>}
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

    /** @type {Record<CompletionKind, (word: string) => string[] | Promise<string[]>>} */
    const argumentCompleters = {
        paths: (word) => completePaths(word, false),
        dirs: (word) => completePaths(word, true),
        commands: completeCommands,
        none: () => [],
    }

    /**
     * @param {CompletionKind | undefined} kind
     * @param {string} word
     * @returns {Promise<string[]>}
     */
    const completeArgument = async (kind, word) => argumentCompleters[kind ?? 'none'](word)

    return async (input, cursor) => {
        const { start, end, word, command } = findWordAtCursor(input, cursor)
        const candidates =
            command === null ? completeCommands(word) : await completeArgument(registry.get(command)?.complete, word)
        return { start, end, candidates }
    }
}

export { createCompleter }
