import { keymap } from './keymap'

/** @typedef {import('./types').Action} Action */
/** @typedef {import('./types').KeyLike} KeyLike */
/** @typedef {import('./types').KeyTable} KeyTable */

/**
 * @param {KeyLike} modifiers
 * @returns {KeyTable | null}
 */
const selectKeyTable = ({ ctrlKey, altKey, metaKey, shiftKey }) => {
    const heldModifierCount = [ctrlKey, altKey, metaKey].filter(Boolean).length
    if (heldModifierCount > 1) return null
    if (ctrlKey) return shiftKey ? null : keymap.ctrl
    if (altKey) return keymap.alt
    if (metaKey) return keymap.meta
    return keymap.plain
}

/**
 * @param {string} key
 * @returns {string}
 */
const lowercaseLetterKey = (key) => (key.length === 1 ? key.toLowerCase() : key)

/**
 * Resolves a keyboard event to the terminal action bound to it, or null when the key is unbound.
 * @param {KeyLike} event
 * @returns {Action | null}
 */
const resolveKey = (event) => {
    const keyTable = selectKeyTable(event)
    if (!keyTable) return null
    const tableKey = lowercaseLetterKey(event.key)
    return Object.hasOwn(keyTable, tableKey) ? keyTable[tableKey] : null
}

export { resolveKey }
