import { describe, expect, test, vi } from 'vitest'
import { createDispatch } from './createDispatch'

/** @import { Action } from '../editor/types' */
/** @import { TerminalActions } from '../store/types' */

const setup = () => {
    /** @type {unknown[][]} */
    const calls = []
    const actions = /** @type {TerminalActions} */ (
        /** @type {unknown} */ (
            Object.fromEntries(
                [
                    'typeText',
                    'applyEdit',
                    'submit',
                    'historyPrev',
                    'historyNext',
                    'interrupt',
                    'eof',
                    'clearScreen',
                    'complete',
                    'historySearch',
                    'acceptSearch',
                    'cancel',
                ].map((name) => [name, vi.fn((...args) => void calls.push([name, ...args]))]),
            )
        )
    )
    const scroll = vi.fn()
    return { calls, scroll, dispatch: createDispatch({ actions, scroll }) }
}

describe('createDispatch', () => {
    test.each(
        /** @type {[Action, unknown[]][]} */ ([
            [{ type: 'edit', op: 'backspace' }, ['applyEdit', 'backspace']],
            [{ type: 'submit' }, ['submit']],
            [{ type: 'historyPrev' }, ['historyPrev']],
            [{ type: 'historyNext' }, ['historyNext']],
            [{ type: 'clearScreen' }, ['clearScreen']],
            [{ type: 'interrupt' }, ['interrupt']],
            [{ type: 'eof' }, ['eof']],
            [{ type: 'complete' }, ['complete']],
            [{ type: 'historySearch' }, ['historySearch']],
            [{ type: 'acceptSearch' }, ['acceptSearch']],
            [{ type: 'cancel' }, ['cancel']],
            [{ type: 'insert', text: 'cat ' }, ['typeText', 'cat ']],
        ]),
    )('routes %o to the matching store action', (action, expected) => {
        const { calls, scroll, dispatch } = setup()
        dispatch(action)
        expect(calls).toEqual([expected])
        expect(scroll).not.toHaveBeenCalled()
    })

    test('run clears the line, types it and submits, in that order', () => {
        const { calls, dispatch } = setup()
        dispatch({ type: 'run', line: 'cd ..' })
        expect(calls).toEqual([['applyEdit', 'clearLine'], ['typeText', 'cd ..'], ['submit']])
    })

    test('scroll goes to scroll with the same object and never touches the store', () => {
        const { calls, scroll, dispatch } = setup()
        /** @type {Action} */
        const action = { type: 'scroll', by: 'page', direction: -1 }
        dispatch(action)
        expect(scroll).toHaveBeenCalledExactlyOnceWith(action)
        expect(calls).toEqual([])
    })
})
