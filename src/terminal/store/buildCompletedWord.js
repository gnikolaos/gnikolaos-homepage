import { escapeWord } from '../shell/escapeWord'

/**
 * Builds the escaped word for a single completion candidate, with a trailing space unless it is a directory.
 * @param {string} candidate
 * @returns {string}
 */
const buildCompletedWord = (candidate) => escapeWord(candidate) + (candidate.endsWith('/') ? '' : ' ')

export { buildCompletedWord }
