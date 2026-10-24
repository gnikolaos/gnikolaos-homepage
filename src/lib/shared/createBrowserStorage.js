import { createMemoryStorage } from './createMemoryStorage'

/** @import { KeyValueStorage } from './types' */

/**
 * Returns the named web storage, or an in-memory storage when it is missing or its access throws.
 * @param {'sessionStorage' | 'localStorage'} name
 * @returns {KeyValueStorage}
 */
const createBrowserStorage = (name) => {
    try {
        return globalThis[name] ?? createMemoryStorage()
    } catch {
        return createMemoryStorage()
    }
}

export { createBrowserStorage }
