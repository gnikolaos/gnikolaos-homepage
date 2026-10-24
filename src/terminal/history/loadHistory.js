/** @typedef {import('./types').HistoryStorage} HistoryStorage */

/**
 * @param {HistoryStorage} storage
 * @param {string} key
 * @returns {string | null}
 */
const readStoredValue = (storage, key) => {
    try {
        return storage.getItem(key)
    } catch {
        return null
    }
}

/**
 * @param {string} json
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
 * Loads the saved history entries, returning [] when storage is unreadable or the value is corrupt.
 * @param {HistoryStorage} storage
 * @param {string} key
 * @returns {string[]}
 */
const loadHistory = (storage, key) => {
    const storedValue = readStoredValue(storage, key)
    const parsedValue = storedValue === null ? null : parseJsonOrNull(storedValue)
    if (!Array.isArray(parsedValue)) return []
    return parsedValue.filter((entry) => typeof entry === 'string')
}

export { loadHistory }
