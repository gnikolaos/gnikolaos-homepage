import { expect } from 'vitest'
import { FsError } from '@gnikolaos/terminal/fs/FsError'

/**
 * Asserts that a promise rejects with an FsError carrying the given code and, when given, path.
 * @param {Promise<unknown>} promise
 * @param {string} code
 * @param {string} [path]
 */
const expectFsError = async (promise, code, path) => {
    await expect(promise).rejects.toBeInstanceOf(FsError)
    await expect(promise).rejects.toMatchObject(path === undefined ? { code } : { code, path })
}

export { expectFsError }
