import { createNavigation } from './createNavigation'

/** @import { Navigation, NavigationStep } from './types' */

/**
 * Steps to the next newer entry, restoring the draft after the newest one.
 * @param {Navigation} nav
 * @param {readonly string[]} entries
 * @returns {NavigationStep | null}
 */
const stepHistoryForward = (nav, entries) => {
    if (nav.index === null) return null
    const index = nav.index + 1
    if (index >= entries.length) return { nav: createNavigation(), input: nav.draft }
    return { nav: { index, draft: nav.draft }, input: entries[index] }
}

export { stepHistoryForward }
