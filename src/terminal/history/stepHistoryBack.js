/** @import { Navigation, NavigationStep } from './types' */

/**
 * Steps to the next older entry, saving the current input as the draft on the first step.
 * @param {Navigation} nav
 * @param {readonly string[]} entries
 * @param {string} currentInput
 * @returns {NavigationStep | null}
 */
const stepHistoryBack = (nav, entries, currentInput) => {
    if (entries.length === 0 || nav.index === 0) return null
    const draft = nav.index === null ? currentInput : nav.draft
    const index = nav.index === null ? entries.length - 1 : Math.min(nav.index, entries.length) - 1
    return { nav: { index, draft }, input: entries[index] }
}

export { stepHistoryBack }
