import { describe, expect, test } from 'vitest'
import * as lineEditor from './lineEditor.js'
import { resolveKey } from './keymap.js'

const key = (k, mods = {}) => ({
    key: k,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...mods,
})
const ctrl = (k) => key(k, { ctrlKey: true })
const alt = (k) => key(k, { altKey: true })
const meta = (k) => key(k, { metaKey: true })
const edit = (op) => ({ type: 'edit', op })

describe('resolveKey', () => {
    test.each([
        ['Enter', { type: 'submit' }],
        ['ArrowUp', { type: 'historyPrev' }],
        ['ArrowDown', { type: 'historyNext' }],
        ['ArrowLeft', edit('moveLeft')],
        ['ArrowRight', edit('moveRight')],
        ['Home', edit('moveHome')],
        ['End', edit('moveEnd')],
        ['Backspace', edit('backspace')],
        ['Delete', edit('deleteForward')],
        ['Tab', { type: 'complete' }],
    ])('plain %s', (k, action) => {
        expect(resolveKey(key(k))).toEqual(action)
    })

    test.each([
        ['a', edit('moveHome')],
        ['e', edit('moveEnd')],
        ['w', edit('killWord')],
        ['u', edit('clearLine')],
        ['k', edit('killToEnd')],
        ['l', { type: 'clearScreen' }],
        ['c', { type: 'interrupt' }],
        ['d', { type: 'eof' }],
        ['ArrowLeft', edit('moveWordLeft')],
        ['ArrowRight', edit('moveWordRight')],
    ])('Ctrl+%s', (k, action) => {
        expect(resolveKey(ctrl(k))).toEqual(action)
    })

    test('Ctrl letters match regardless of case', () => {
        expect(resolveKey(ctrl('C'))).toEqual({ type: 'interrupt' })
    })

    test.each([
        ['ArrowLeft', edit('moveWordLeft')],
        ['ArrowRight', edit('moveWordRight')],
        ['Backspace', edit('killWord')],
    ])('Alt+%s', (k, action) => {
        expect(resolveKey(alt(k))).toEqual(action)
    })

    test.each([
        ['ArrowLeft', edit('moveHome')],
        ['ArrowRight', edit('moveEnd')],
    ])('Meta+%s on mac', (k, action) => {
        expect(resolveKey(meta(k))).toEqual(action)
    })

    test.each(['a', 'Z', '1', ' ', '/', 'é'])('printable %j is left to the input event', (k) => {
        expect(resolveKey(key(k))).toBeNull()
        expect(resolveKey(key(k, { shiftKey: true }))).toBeNull()
    })

    test.each(['v', 't', 'r', 'F5'])('Ctrl+%s is not an action', (k) => {
        expect(resolveKey(ctrl(k))).toBeNull()
    })

    test.each(['c', 'C', 'l', 'ArrowLeft', 'Backspace'])('Ctrl+Shift+%s is not an action', (k) => {
        expect(resolveKey(key(k, { ctrlKey: true, shiftKey: true }))).toBeNull()
    })

    test.each(['F1', 'F12', 'Escape', 'PageUp', 'Shift', 'Control'])('%s is not an action', (k) => {
        expect(resolveKey(key(k))).toBeNull()
    })

    test('Meta and Alt only bind their listed keys', () => {
        expect(resolveKey(meta('c'))).toBeNull()
        expect(resolveKey(meta('v'))).toBeNull()
        expect(resolveKey(alt('b'))).toBeNull()
    })

    test('combined modifiers are not actions', () => {
        expect(resolveKey(key('ArrowLeft', { ctrlKey: true, altKey: true }))).toBeNull()
        expect(resolveKey(key('ArrowLeft', { metaKey: true, altKey: true }))).toBeNull()
    })

    test('treats missing modifier flags as false', () => {
        expect(resolveKey({ key: 'Enter' })).toEqual({ type: 'submit' })
    })

    test('ignores inherited object keys', () => {
        expect(resolveKey(key('toString'))).toBeNull()
        expect(resolveKey(key('constructor'))).toBeNull()
    })

    test('every edit op exists in lineEditor', () => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Backspace', 'Delete']
        const events = [
            ...keys.map((k) => key(k)),
            ...['a', 'e', 'w', 'u', 'k', 'ArrowLeft', 'ArrowRight'].map(ctrl),
            ...['ArrowLeft', 'ArrowRight', 'Backspace'].map(alt),
            ...['ArrowLeft', 'ArrowRight'].map(meta),
        ]
        for (const event of events) {
            const action = resolveKey(event)
            expect(action?.type).toBe('edit')
            expect(typeof lineEditor[action.op]).toBe('function')
        }
    })
})
