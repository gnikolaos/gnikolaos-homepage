/** @import { Action, EditOp, KeyTable, ScrollAction } from './types' */

/**
 * @param {EditOp} op
 * @returns {Action}
 */
const createEditAction = (op) => ({ type: 'edit', op })

/**
 * @param {ScrollAction['by']} by
 * @param {ScrollAction['direction']} direction
 * @returns {ScrollAction}
 */
const createScrollAction = (by, direction) => ({ type: 'scroll', by, direction })

/** @type {Readonly<{ plain: KeyTable, ctrl: KeyTable, alt: KeyTable, meta: KeyTable }>} */
const keymap = Object.freeze({
    plain: {
        Enter: { type: 'submit' },
        ArrowUp: { type: 'historyPrev' },
        ArrowDown: { type: 'historyNext' },
        ArrowLeft: createEditAction('moveLeft'),
        ArrowRight: createEditAction('moveRight'),
        Home: createEditAction('moveHome'),
        End: createEditAction('moveEnd'),
        Backspace: createEditAction('backspace'),
        Delete: createEditAction('deleteForward'),
        Tab: { type: 'complete' },
        Escape: { type: 'acceptSearch' },
        PageUp: createScrollAction('page', -1),
        PageDown: createScrollAction('page', 1),
    },
    ctrl: {
        a: createEditAction('moveHome'),
        e: createEditAction('moveEnd'),
        w: createEditAction('killWord'),
        u: createEditAction('clearLine'),
        j: createScrollAction('line', 1),
        k: createScrollAction('line', -1),
        l: { type: 'clearScreen' },
        c: { type: 'interrupt' },
        d: { type: 'eof' },
        r: { type: 'historySearch' },
        g: { type: 'cancel' },
        ArrowLeft: createEditAction('moveWordLeft'),
        ArrowRight: createEditAction('moveWordRight'),
        Home: createScrollAction('edge', -1),
        End: createScrollAction('edge', 1),
    },
    alt: {
        ArrowLeft: createEditAction('moveWordLeft'),
        ArrowRight: createEditAction('moveWordRight'),
        Backspace: createEditAction('killWord'),
    },
    meta: {
        ArrowLeft: createEditAction('moveHome'),
        ArrowRight: createEditAction('moveEnd'),
    },
})

export { keymap }
