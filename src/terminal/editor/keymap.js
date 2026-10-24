/** @import { Action, EditOp, KeyTable } from './types' */

/**
 * @param {EditOp} op
 * @returns {Action}
 */
const createEditAction = (op) => ({ type: 'edit', op })

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
    },
    ctrl: {
        a: createEditAction('moveHome'),
        e: createEditAction('moveEnd'),
        w: createEditAction('killWord'),
        u: createEditAction('clearLine'),
        k: createEditAction('killToEnd'),
        l: { type: 'clearScreen' },
        c: { type: 'interrupt' },
        d: { type: 'eof' },
        r: { type: 'historySearch' },
        g: { type: 'cancel' },
        ArrowLeft: createEditAction('moveWordLeft'),
        ArrowRight: createEditAction('moveWordRight'),
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
