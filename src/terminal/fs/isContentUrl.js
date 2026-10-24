import { CONTENT_URL } from './CONTENT_URL'

/**
 * Tells whether a url points at or below the content root.
 * @param {string} url
 * @returns {boolean}
 */
const isContentUrl = (url) => url === CONTENT_URL || url.startsWith(CONTENT_URL + '/')

export { isContentUrl }
