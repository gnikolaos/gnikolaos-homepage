/** @import { FsErrorCode } from './types' */

const FS_ERROR_DESCRIPTIONS = {
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
        super(`${code}: ${FS_ERROR_DESCRIPTIONS[code]}, '${path}'`)
        this.name = 'FsError'
        this.code = code
        this.path = path
        this.description = FS_ERROR_DESCRIPTIONS[code]
    }
}

export { FsError }
