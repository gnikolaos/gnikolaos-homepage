/**
 * Finds the newest entry at or below `fromIndex` containing `query`, returning its index or null.
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

export { searchHistory }
