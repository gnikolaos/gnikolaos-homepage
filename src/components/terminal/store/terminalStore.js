import { createStore } from 'solid-js/store'

/**
 * @typedef {Object} Line
 * @property {Prompt} prompt - The prompt data for the terminal.
 * @property {Output} output - The output data for the terminal.
 * @property {string} input - The user's input.
 * @property {number} cursorPosition - The cursor position in the input.
 */

/**
 * @typedef {Object} Prompt
 * @property {string} path - The current path in the terminal.
 * @property {'default' | 'failure' | 'success'} status - The status of the terminal. Determines the color of the '>'.
 */

/**
 * @typedef {Object} Output
 * @property {'raw' | 'markdown' | 'plain'} type - The type of output, e.g., 'raw'.
 * @property {string} content - Plain string or Markdown.
 */

/**
 * @typedef {Object} History
 * @property {Array<string>} commands - A history of commands entered by the user.
 * @property {number | boolean} historyIndex - The current index in the command history, or -1 if not navigating.
 */

/**
 * @typedef {Object} TerminalStore
 * @property {Array<Line>} lines - The lines of the terminal.
 * @property {number} currentLineIndex - The index of the currently active line.
 * @property {History} history - The command history data for the terminal.
 */

/** @type {[TerminalStore, import('solid-js/store').SetStoreFunction<TerminalStore>]} */
const [terminalStore, setTerminalStore] = createStore({
    lines: [
        {
            input: '',
            cursorPosition: 0,
            prompt: { path: '~', status: 'default' },
            output: {
                type: 'raw',
                content: '',
            },
        },
    ],
    history: {
        commands: [],
        historyIndex: -1,
    },
    currentLineIndex: 0,
})

export { terminalStore, setTerminalStore }
