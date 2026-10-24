import { createMemoryStorage } from '../history/createMemoryStorage'

/**
 * Creates the history storage backed by sessionStorage, or in memory when sessionStorage is unavailable.
 * @returns {import('../history/types').HistoryStorage}
 */
const createBrowserStorage = () => {
    try {
        return globalThis.sessionStorage ?? createMemoryStorage()
    } catch {
        return createMemoryStorage()
    }
}

export { createBrowserStorage }
