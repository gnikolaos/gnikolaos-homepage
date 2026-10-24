import { FsError } from './FsError'

/** @typedef {import('./vfs').Entry} Entry */
/** @typedef {typeof globalThis.fetch} Fetch */

const CONTENT_URL = '/dirs'

/**
 * @param {string} url
 * @returns {boolean}
 */
const isContentUrl = (url) => url === CONTENT_URL || url.startsWith(CONTENT_URL + '/')

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
 * @param {Fetch} fetchImpl
 * @param {string} url
 * @param {string} errorPath
 * @returns {Promise<Response>}
 */
const request = async (fetchImpl, url, errorPath) => {
    try {
        return await fetchImpl(url)
    } catch {
        throw new FsError('EIO', errorPath)
    }
}

/**
 * @param {string} dirUrl
 * @param {Fetch} [fetchImpl]
 * @returns {Promise<Entry[]>}
 */
const fetchManifest = async (dirUrl, fetchImpl = globalThis.fetch) => {
    if (!isContentUrl(dirUrl)) throw new FsError('ENOENT', dirUrl)
    const response = await request(fetchImpl, `${dirUrl}/_manifest.json`, dirUrl)
    if (!response.ok) throw new FsError('ENOENT', dirUrl)
    let body
    try {
        body = await response.json()
    } catch {
        throw new FsError('EIO', dirUrl)
    }
    if (!isManifest(body)) throw new FsError('EIO', dirUrl)
    return body.entries
}

/**
 * @param {string} fileUrl
 * @param {Fetch} [fetchImpl]
 * @returns {Promise<string>}
 */
const fetchFile = async (fileUrl, fetchImpl = globalThis.fetch) => {
    if (!isContentUrl(fileUrl) || !fileUrl.endsWith('.md')) throw new FsError('ENOENT', fileUrl)
    const response = await request(fetchImpl, fileUrl, fileUrl)
    if (response.status === 404) throw new FsError('ENOENT', fileUrl)
    if (!response.ok) throw new FsError('EIO', fileUrl)
    try {
        return await response.text()
    } catch {
        throw new FsError('EIO', fileUrl)
    }
}

/** @type {import('./vfs').FsIo} */
const browserIo = {
    loadManifest: (dirUrl) => fetchManifest(dirUrl),
    loadFile: (fileUrl) => fetchFile(fileUrl),
}

export { fetchManifest, fetchFile, browserIo }
