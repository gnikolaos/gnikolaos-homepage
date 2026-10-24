import { FsError } from './FsError'

/**
 * Tells whether a thrown value is an FsError.
 * @param {unknown} error
 * @returns {error is FsError}
 */
const isFsError = (error) => error instanceof FsError

export { isFsError }
