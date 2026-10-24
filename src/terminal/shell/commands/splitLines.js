/**
 * Splits text into lines, dropping the empty element after a trailing newline.
 * @param {string} text
 * @returns {string[]}
 */
const splitLines = (text) => {
    if (text === '') return []
    const lines = text.split('\n')
    if (text.endsWith('\n')) lines.pop()
    return lines
}

export { splitLines }
