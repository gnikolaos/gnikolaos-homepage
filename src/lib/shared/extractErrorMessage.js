/**
 * Extracts the message of a thrown Error, or stringifies any other thrown value.
 * @param {unknown} error
 * @returns {string}
 */
const extractErrorMessage = (error) => (error instanceof Error ? error.message : String(error))

export { extractErrorMessage }
