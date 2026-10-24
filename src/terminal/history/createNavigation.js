/** @typedef {import('./types').Navigation} Navigation */

/**
 * Creates a navigation positioned on the draft, outside the history entries.
 * @returns {Navigation}
 */
const createNavigation = () => ({ index: null, draft: '' })

export { createNavigation }
