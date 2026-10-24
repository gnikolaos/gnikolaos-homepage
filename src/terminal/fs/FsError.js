/** @typedef {'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EIO'} FsErrorCode */

const descriptions = {
    ENOENT: 'No such file or directory',
    ENOTDIR: 'Not a directory',
    EISDIR: 'Is a directory',
    EIO: 'Input/output error',
}

class FsError extends Error {
    /**
     * @param {FsErrorCode} code
     * @param {string} path
     */
    constructor(code, path) {
        super(`${code}: ${descriptions[code]}, '${path}'`)
        this.name = 'FsError'
        this.code = code
        this.path = path
        this.description = descriptions[code]
    }
}

/**
 * @param {unknown} error
 * @returns {error is FsError}
 */
const isFsError = (error) => error instanceof FsError

export { FsError, isFsError }
