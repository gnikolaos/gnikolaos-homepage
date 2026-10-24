import { FsError } from './FsError'
import { fetchOrThrowEio } from './fetchOrThrowEio'
import { isContentUrl } from './isContentUrl'

/** @typedef {import('./types').Fetch} Fetch */

/**
 * Fetches the text of a markdown file under the content root.
 * @param {string} fileUrl
 * @param {Fetch} [fetchImpl]
 * @returns {Promise<string>}
 */
const fetchFile = async (fileUrl, fetchImpl = globalThis.fetch) => {
    if (!isContentUrl(fileUrl) || !fileUrl.endsWith('.md')) throw new FsError('ENOENT', fileUrl)
    const response = await fetchOrThrowEio(fetchImpl, fileUrl, fileUrl)
    if (response.status === 404) throw new FsError('ENOENT', fileUrl)
    if (!response.ok) throw new FsError('EIO', fileUrl)
    try {
        return await response.text()
    } catch {
        throw new FsError('EIO', fileUrl)
    }
}

export { fetchFile }
