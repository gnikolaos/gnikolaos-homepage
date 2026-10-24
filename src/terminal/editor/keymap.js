/**
 * @typedef {keyof typeof import('./lineEditor.js')} EditOp
 */

/**
 * @typedef {{ type: 'edit', op: EditOp }
 *     | { type: 'submit' | 'historyPrev' | 'historyNext' | 'clearScreen' | 'interrupt' | 'eof' | 'complete' }} Action
 */

/**
 * @typedef {object} KeyLike
 * @property {string} key
 * @property {boolean} [ctrlKey]
 * @property {boolean} [altKey]
 * @property {boolean} [metaKey]
 * @property {boolean} [shiftKey]
 */

/**
 * @param {EditOp} op
 * @returns {Action}
 */
const edit = (op) => ({ type: 'edit', op })

/** @type {Record<string, Action>} */
const plainKeys = {
    Enter: { type: 'submit' },
    ArrowUp: { type: 'historyPrev' },
    ArrowDown: { type: 'historyNext' },
    ArrowLeft: edit('moveLeft'),
    ArrowRight: edit('moveRight'),
    Home: edit('moveHome'),
    End: edit('moveEnd'),
    Backspace: edit('backspace'),
    Delete: edit('deleteForward'),
    Tab: { type: 'complete' },
}

/** @type {Record<string, Action>} */
const ctrlKeys = {
    a: edit('moveHome'),
    e: edit('moveEnd'),
    w: edit('killWord'),
    u: edit('clearLine'),
    k: edit('killToEnd'),
    l: { type: 'clearScreen' },
    c: { type: 'interrupt' },
    d: { type: 'eof' },
    ArrowLeft: edit('moveWordLeft'),
    ArrowRight: edit('moveWordRight'),
}

/** @type {Record<string, Action>} */
const altKeys = {
    ArrowLeft: edit('moveWordLeft'),
    ArrowRight: edit('moveWordRight'),
    Backspace: edit('killWord'),
}

/** @type {Record<string, Action>} */
const metaKeys = {
    ArrowLeft: edit('moveHome'),
    ArrowRight: edit('moveEnd'),
}

/**
 * @param {KeyLike} event
 * @returns {Record<string, Action> | null}
 */
const tableFor = ({ ctrlKey, altKey, metaKey, shiftKey }) => {
    const modifiers = [ctrlKey, altKey, metaKey].filter(Boolean).length
    if (modifiers > 1) return null
    if (ctrlKey) return shiftKey ? null : ctrlKeys
    if (altKey) return altKeys
    if (metaKey) return metaKeys
    return plainKeys
}

/**
 * @param {string} key
 * @returns {string}
 */
const normalizeKey = (key) => (key.length === 1 ? key.toLowerCase() : key)

/**
 * @param {KeyLike} event
 * @returns {Action | null}
 */
const resolveKey = (event) => {
    const table = tableFor(event)
    if (!table) return null
    return Object.hasOwn(table, normalizeKey(event.key)) ? table[normalizeKey(event.key)] : null
}

export { resolveKey }
