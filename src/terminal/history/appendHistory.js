/**
 * Returns a copy of `entries` with the trimmed line appended, skipping blanks and repeats and keeping the newest `max`.
 * @param {readonly string[]} entries
 * @param {string} line
 * @param {{ max?: number }} [options]
 * @returns {string[]}
 */
const appendHistory = (entries, line, { max = 500 } = {}) => {
    const trimmedLine = line.trim()
    if (!trimmedLine || entries.at(-1) === trimmedLine) return [...entries]
    return [...entries, trimmedLine].slice(-max)
}

export { appendHistory }
