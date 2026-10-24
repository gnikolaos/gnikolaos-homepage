/** @import { HistoryStorage } from './types' */

/**
 * Parses a JSON string, returning null when it is missing or corrupt.
 * @param {string | null} json
 * @returns {unknown}
 */
const parseJsonOrNull = (json) => {
    try {
        return JSON.parse(json)
    } catch {
        return null
    }
}

/**
 * Loads the saved history entries, returning [] when the value is missing or corrupt.
 * @param {HistoryStorage} storage
 * @param {string} key
 * @returns {string[]}
 */
const loadHistory = (storage, key) => {
    const parsedValue = parseJsonOrNull(storage.getItem(key))
    if (!Array.isArray(parsedValue)) return []
    return parsedValue.filter((entry) => typeof entry === 'string')
}

export { loadHistory }
