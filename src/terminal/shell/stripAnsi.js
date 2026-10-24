import { SGR_PATTERN } from './SGR_PATTERN'

/**
 * Strips every SGR sequence from text, keeping the text itself.
 * @param {string} text
 * @returns {string}
 */
const stripAnsi = (text) => text.replace(SGR_PATTERN, '')

export { stripAnsi }
