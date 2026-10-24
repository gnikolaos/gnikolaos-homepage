import { FsError } from './FsError'
import { fetchOrThrowEio } from './fetchOrThrowEio'
import { isContentUrl } from './isContentUrl'

/** @typedef {import('./types').Entry} Entry */
/** @typedef {import('./types').Fetch} Fetch */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isObject = (value) => typeof value === 'object' && value !== null

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isOptionalNumber = (value) => value === undefined || typeof value === 'number'

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isOptionalString = (value) => value === undefined || typeof value === 'string'

/**
 * @param {unknown} value
 * @returns {value is Entry}
 */
const isEntry = (value) =>
    isObject(value) &&
    typeof value.name === 'string' &&
    value.name !== '' &&
    (value.type === 'dir' || value.type === 'file') &&
    isOptionalNumber(value.size) &&
    isOptionalString(value.mtime) &&
    isOptionalString(value.title)

/**
 * @param {unknown} value
 * @returns {value is { entries: Entry[] }}
 */
const isManifest = (value) => isObject(value) && Array.isArray(value.entries) && value.entries.every(isEntry)

/**
 * Fetches and validates the manifest of a content dir, returning its entries.
 * @param {string} dirUrl
 * @param {Fetch} [fetchImpl]
 * @returns {Promise<Entry[]>}
 */
const fetchManifest = async (dirUrl, fetchImpl = globalThis.fetch) => {
    if (!isContentUrl(dirUrl)) throw new FsError('ENOENT', dirUrl)
    const response = await fetchOrThrowEio(fetchImpl, `${dirUrl}/_manifest.json`, dirUrl)
    if (!response.ok) throw new FsError('ENOENT', dirUrl)
    let parsedBody
    try {
        parsedBody = await response.json()
    } catch {
        throw new FsError('EIO', dirUrl)
    }
    if (!isManifest(parsedBody)) throw new FsError('EIO', dirUrl)
    return parsedBody.entries
}

export { fetchManifest }
