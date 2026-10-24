/**
 * @typedef {Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} HistoryStorage
 */

/**
 * @typedef {{ index: number | null, draft: string }} Navigation
 */

/**
 * @typedef {{ nav: Navigation, input: string }} NavigationStep
 */

/**
 * @param {HistoryStorage} storage
 * @param {string} key
 * @returns {string | null}
 */
const readRaw = (storage, key) => {
    try {
        return storage.getItem(key)
    } catch {
        return null
    }
}

/**
 * @param {string} raw
 * @returns {unknown}
 */
const parseJson = (raw) => {
    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}

/**
 * @param {HistoryStorage} storage
 * @param {string} key
 * @returns {string[]}
 */
const loadHistory = (storage, key) => {
    const raw = readRaw(storage, key)
    const parsed = raw === null ? null : parseJson(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry) => typeof entry === 'string')
}

/**
 * @param {HistoryStorage} storage
 * @param {string} key
 * @param {readonly string[]} entries
 * @returns {void}
 */
const saveHistory = (storage, key, entries) => {
    try {
        storage.setItem(key, JSON.stringify(entries))
    } catch {
        return
    }
}

/**
 * @param {readonly string[]} entries
 * @param {string} line
 * @param {{ max?: number }} [options]
 * @returns {string[]}
 */
const appendHistory = (entries, line, { max = 500 } = {}) => {
    const trimmed = line.trim()
    if (!trimmed || entries.at(-1) === trimmed) return [...entries]
    return [...entries, trimmed].slice(-max)
}

/** @returns {Navigation} */
const createNavigation = () => ({ index: null, draft: '' })

/**
 * @param {Navigation} nav
 * @param {readonly string[]} entries
 * @param {string} currentInput
 * @returns {NavigationStep | null}
 */
const historyUp = (nav, entries, currentInput) => {
    if (entries.length === 0 || nav.index === 0) return null
    const draft = nav.index === null ? currentInput : nav.draft
    const index = nav.index === null ? entries.length - 1 : Math.min(nav.index, entries.length) - 1
    return { nav: { index, draft }, input: entries[index] }
}

/**
 * @param {Navigation} nav
 * @param {readonly string[]} entries
 * @returns {NavigationStep | null}
 */
const historyDown = (nav, entries) => {
    if (nav.index === null) return null
    const index = nav.index + 1
    if (index >= entries.length) return { nav: createNavigation(), input: nav.draft }
    return { nav: { index, draft: nav.draft }, input: entries[index] }
}

/**
 * @param {readonly string[]} entries
 * @param {string} query
 * @param {number} fromIndex
 * @returns {number | null}
 */
const searchHistory = (entries, query, fromIndex) => {
    if (!query) return null
    for (let index = Math.min(fromIndex, entries.length - 1); index >= 0; index -= 1) {
        if (entries[index].includes(query)) return index
    }
    return null
}

export { loadHistory, saveHistory, appendHistory, createNavigation, historyUp, historyDown, searchHistory }
