/** @typedef {import('../shell/types').Completion} Completion */
/** @typedef {(input: string, cursor: number) => Promise<Completion>} Completer */

/** @typedef {'ok' | 'error'} PromptStatus */
/**
 * @typedef {{ id: number, kind: 'prompt', cwd: string, input: string, status: PromptStatus, running: boolean }}
 *     PromptBlock
 */
/** @typedef {{ kind: 'plain' | 'markdown', content: string }} OutputContent */
/** @typedef {{ id: number, kind: 'output', output: OutputContent }} OutputBlock */
/** @typedef {PromptBlock | OutputBlock} Block */
/** @typedef {{ query: string, index: number | null, draft: string }} SearchState */

/**
 * @typedef {object} TerminalState
 * @property {{ user: string, host: string, cwd: string }} session
 * @property {Block[]} blocks
 * @property {import('../editor/types').EditorState} editor
 * @property {{ entries: string[], nav: import('../history/types').Navigation }} history
 * @property {boolean} busy
 * @property {number} lastExitCode
 * @property {SearchState | null} search
 * @property {number} columns
 */

/**
 * @typedef {object} TerminalActions
 * @property {(text: string) => void} typeText
 * @property {(op: import('../editor/types').EditOp) => void} applyEdit
 * @property {() => Promise<void>} submit
 * @property {() => void} historyPrev
 * @property {() => void} historyNext
 * @property {() => void} interrupt
 * @property {() => Promise<void>} eof
 * @property {() => void} clearScreen
 * @property {(line: string) => Promise<void>} runLine
 * @property {(fn: (path: string) => void) => void} setNavigate
 * @property {() => Promise<void>} complete
 * @property {() => void} historySearch
 * @property {() => void} acceptSearch
 * @property {() => void} cancel
 * @property {(columns: number) => void} setColumns
 */

/** @typedef {{ state: TerminalState, actions: TerminalActions }} TerminalStore */

/**
 * @typedef {object} TerminalOptions
 * @property {(hooks: import('../shell/types').ShellHooks) => import('../shell/types').Shell} makeShell
 * @property {import('../history/types').HistoryStorage} storage
 * @property {string} home
 * @property {string} [user]
 * @property {string} [host]
 * @property {(url: string) => void} [openUrl]
 * @property {Completer} [complete]
 */

export {}
