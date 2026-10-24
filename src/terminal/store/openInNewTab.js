/**
 * Opens a URL in a new browser tab without giving it access to this window.
 * @param {string} url
 * @returns {void}
 */
const openInNewTab = (url) => void window.open(url, '_blank', 'noopener,noreferrer')

export { openInNewTab }
