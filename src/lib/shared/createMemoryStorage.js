/** @import { KeyValueStorage } from './types' */

/**
 * Creates an in-memory key-value storage for when the browser's web storage is unavailable.
 * @returns {KeyValueStorage}
 */
const createMemoryStorage = () => {
    const items = new Map()
    return {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => void items.set(key, String(value)),
        removeItem: (key) => void items.delete(key),
    }
}

export { createMemoryStorage }
