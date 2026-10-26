/** @import { Action, ScrollAction } from '../editor/types' */
/** @import { TerminalActions } from '../store/types' */

/**
 * Creates the dispatcher that routes editor actions from the keyboard and the touch bar to the store.
 * @param {{ actions: TerminalActions, scroll: (action: ScrollAction) => void }} deps
 * @returns {(action: Action) => void}
 */
export const createDispatch =
    ({ actions, scroll }) =>
    (action) => {
        switch (action.type) {
            case 'edit':
                return actions.applyEdit(action.op)
            case 'submit':
                return void actions.submit()
            case 'historyPrev':
                return actions.historyPrev()
            case 'historyNext':
                return actions.historyNext()
            case 'clearScreen':
                return actions.clearScreen()
            case 'interrupt':
                return actions.interrupt()
            case 'eof':
                return void actions.eof()
            case 'complete':
                return void actions.complete()
            case 'historySearch':
                return actions.historySearch()
            case 'acceptSearch':
                return actions.acceptSearch()
            case 'cancel':
                return actions.cancel()
            case 'insert':
                return actions.typeText(action.text)
            case 'run':
                actions.applyEdit('clearLine')
                actions.typeText(action.line)
                return void actions.submit()
            case 'scroll':
                return scroll(action)
        }
    }
