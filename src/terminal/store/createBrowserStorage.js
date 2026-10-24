import { createMemoryStorage } from '../history/createMemoryStorage'

/** @import { HistoryStorage } from '../history/types' */

/**
 * Creates the history storage backed by sessionStorage, or in memory when sessionStorage is unavailable.
 * @returns {HistoryStorage}
 */
const createBrowserStorage = () => {
    try {
        return globalThis.sessionStorage ?? createMemoryStorage()
    } catch {
        return createMemoryStorage()
    }
}

export { createBrowserStorage }
