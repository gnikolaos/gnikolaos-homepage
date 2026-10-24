import { assert, describe, expect, test } from 'vitest'
import { lineEditor } from './lineEditor'
import { resolveKey } from './resolveKey'

const createKeyEvent = (key, modifiers = {}) => ({
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
})
const createCtrlKeyEvent = (key) => createKeyEvent(key, { ctrlKey: true })
const createAltKeyEvent = (key) => createKeyEvent(key, { altKey: true })
const createMetaKeyEvent = (key) => createKeyEvent(key, { metaKey: true })
const createEditAction = (op) => ({ type: 'edit', op })

describe('resolveKey', () => {
    test.each([
        ['Enter', { type: 'submit' }],
        ['ArrowUp', { type: 'historyPrev' }],
        ['ArrowDown', { type: 'historyNext' }],
        ['ArrowLeft', createEditAction('moveLeft')],
        ['ArrowRight', createEditAction('moveRight')],
        ['Home', createEditAction('moveHome')],
        ['End', createEditAction('moveEnd')],
        ['Backspace', createEditAction('backspace')],
        ['Delete', createEditAction('deleteForward')],
        ['Tab', { type: 'complete' }],
        ['Escape', { type: 'acceptSearch' }],
    ])('plain %s', (key, action) => {
        expect(resolveKey(createKeyEvent(key))).toEqual(action)
    })

    test.each([
        ['a', createEditAction('moveHome')],
        ['e', createEditAction('moveEnd')],
        ['w', createEditAction('killWord')],
        ['u', createEditAction('clearLine')],
        ['k', createEditAction('killToEnd')],
        ['l', { type: 'clearScreen' }],
        ['c', { type: 'interrupt' }],
        ['d', { type: 'eof' }],
        ['r', { type: 'historySearch' }],
        ['g', { type: 'cancel' }],
        ['ArrowLeft', createEditAction('moveWordLeft')],
        ['ArrowRight', createEditAction('moveWordRight')],
    ])('Ctrl+%s', (key, action) => {
        expect(resolveKey(createCtrlKeyEvent(key))).toEqual(action)
    })

    test('Ctrl letters match regardless of case', () => {
        expect(resolveKey(createCtrlKeyEvent('C'))).toEqual({ type: 'interrupt' })
    })

    test.each([
        ['ArrowLeft', createEditAction('moveWordLeft')],
        ['ArrowRight', createEditAction('moveWordRight')],
        ['Backspace', createEditAction('killWord')],
    ])('Alt+%s', (key, action) => {
        expect(resolveKey(createAltKeyEvent(key))).toEqual(action)
    })

    test.each([
        ['ArrowLeft', createEditAction('moveHome')],
        ['ArrowRight', createEditAction('moveEnd')],
    ])('Meta+%s on mac', (key, action) => {
        expect(resolveKey(createMetaKeyEvent(key))).toEqual(action)
    })

    test.each(['a', 'Z', '1', ' ', '/', 'é'])('printable %j is left to the input event', (key) => {
        expect(resolveKey(createKeyEvent(key))).toBeNull()
        expect(resolveKey(createKeyEvent(key, { shiftKey: true }))).toBeNull()
    })

    test.each(['v', 't', 'b', 'F5'])('Ctrl+%s is not an action', (key) => {
        expect(resolveKey(createCtrlKeyEvent(key))).toBeNull()
    })

    test.each(['c', 'C', 'l', 'ArrowLeft', 'Backspace'])('Ctrl+Shift+%s is not an action', (key) => {
        expect(resolveKey(createKeyEvent(key, { ctrlKey: true, shiftKey: true }))).toBeNull()
    })

    test.each(['F1', 'F12', 'PageUp', 'Shift', 'Control'])('%s is not an action', (key) => {
        expect(resolveKey(createKeyEvent(key))).toBeNull()
    })

    test('Meta and Alt only bind their listed keys', () => {
        expect(resolveKey(createMetaKeyEvent('c'))).toBeNull()
        expect(resolveKey(createMetaKeyEvent('v'))).toBeNull()
        expect(resolveKey(createAltKeyEvent('b'))).toBeNull()
    })

    test('combined modifiers are not actions', () => {
        expect(resolveKey(createKeyEvent('ArrowLeft', { ctrlKey: true, altKey: true }))).toBeNull()
        expect(resolveKey(createKeyEvent('ArrowLeft', { metaKey: true, altKey: true }))).toBeNull()
    })

    test('treats missing modifier flags as false', () => {
        expect(resolveKey({ key: 'Enter' })).toEqual({ type: 'submit' })
    })

    test('ignores inherited object keys', () => {
        expect(resolveKey(createKeyEvent('toString'))).toBeNull()
        expect(resolveKey(createKeyEvent('constructor'))).toBeNull()
    })

    test('every edit op exists in lineEditor', () => {
        const plainEditKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Backspace', 'Delete']
        const editKeyEvents = [
            ...plainEditKeys.map((key) => createKeyEvent(key)),
            ...['a', 'e', 'w', 'u', 'k', 'ArrowLeft', 'ArrowRight'].map(createCtrlKeyEvent),
            ...['ArrowLeft', 'ArrowRight', 'Backspace'].map(createAltKeyEvent),
            ...['ArrowLeft', 'ArrowRight'].map(createMetaKeyEvent),
        ]
        for (const event of editKeyEvents) {
            const action = resolveKey(event)
            assert(action?.type === 'edit', `expected edit action for ${event.key}`)
            expect(typeof lineEditor[action.op]).toBe('function')
        }
    })
})
