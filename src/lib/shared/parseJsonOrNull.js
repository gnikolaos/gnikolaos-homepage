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

export { parseJsonOrNull }
