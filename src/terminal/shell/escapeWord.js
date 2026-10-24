/**
 * Escapes whitespace, quotes, backslashes and pipes so the shell reads `word` back as one literal word.
 * @param {string} word
 * @returns {string}
 */
const escapeWord = (word) => word.replace(/[\s'"\\|]/g, '\\$&')

export { escapeWord }
