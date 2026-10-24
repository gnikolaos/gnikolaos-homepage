/**
 * Creates an in-memory history storage for when the browser's sessionStorage is unavailable.
 * @returns {import('./types').HistoryStorage}
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
