import { FsError } from './FsError'

/** @import { Fetch } from './types' */

/**
 * Fetches a url, turning a network failure into an EIO FsError for the given path.
 * @param {Fetch} fetchImpl
 * @param {string} url
 * @param {string} errorPath
 * @returns {Promise<Response>}
 */
const fetchOrThrowEio = async (fetchImpl, url, errorPath) => {
    try {
        return await fetchImpl(url)
    } catch {
        throw new FsError('EIO', errorPath)
    }
}

export { fetchOrThrowEio }
