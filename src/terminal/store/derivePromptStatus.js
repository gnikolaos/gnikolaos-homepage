/** @import { PromptStatus } from './types' */

/**
 * Derives the prompt marker status from the last exit code.
 * @param {number} exitCode
 * @returns {PromptStatus}
 */
const derivePromptStatus = (exitCode) => (exitCode === 0 ? 'ok' : 'error')

export { derivePromptStatus }
