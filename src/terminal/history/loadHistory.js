import { parseJsonOrNull } from '@gnikolaos/lib/shared/parseJsonOrNull'

/** @import { KeyValueStorage } from '@gnikolaos/lib/shared/types' */

/**
 * Loads the saved history entries, returning [] when the value is missing or corrupt.
 * @param {KeyValueStorage} storage
 * @param {string} key
 * @returns {string[]}
 */
const loadHistory = (storage, key) => {
    const parsedValue = parseJsonOrNull(storage.getItem(key))
    if (!Array.isArray(parsedValue)) return []
    return parsedValue.filter((entry) => typeof entry === 'string')
}

export { loadHistory }
