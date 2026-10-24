import { FS_ERROR_DESCRIPTIONS } from './FS_ERROR_DESCRIPTIONS'

/** @import { FsErrorCode } from './types' */

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
