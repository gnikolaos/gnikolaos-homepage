import { batch } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { createEditorFromText } from '../editor/createEditorFromText'
import { createEmptyEditor } from '../editor/createEmptyEditor'
import { insert } from '../editor/insert'
import { lineEditor } from '../editor/lineEditor'
import { appendHistory } from '../history/appendHistory'
import { createMemoryStorage } from '../history/createMemoryStorage'
import { createNavigation } from '../history/createNavigation'
import { loadHistory } from '../history/loadHistory'
import { saveHistory } from '../history/saveHistory'
import { searchHistory } from '../history/searchHistory'
import { stepHistoryBack } from '../history/stepHistoryBack'
import { stepHistoryForward } from '../history/stepHistoryForward'
import { createVfs } from '../fs/createVfs'
import { browserIo } from '../fs/browserIo'
import { createRegistry } from '../shell/createRegistry'
import { createShell } from '../shell/createShell'
import { createCompleter } from '../shell/createCompleter'
import { escapeWord } from '../shell/escapeWord'
import { findCommonPrefix } from '../shell/findCommonPrefix'
import { formatCandidateName } from '../shell/formatCandidateName'
import { formatColumns } from '../shell/formatColumns'
import { EXIT_CODES } from '../shell/EXIT_CODES'
import { commands } from '../shell/commands/index'
import profile from '../profile'

/** @typedef {import('../shell/types').Shell} Shell */
/** @typedef {import('../shell/types').Sink} Sink */
/** @typedef {import('../shell/types').ShellHooks} ShellHooks */
/** @typedef {import('../history/types').HistoryStorage} HistoryStorage */
/** @typedef {import('../history/types').Navigation} Navigation */
/** @typedef {import('../editor/types').EditorState} EditorState */
/** @typedef {import('../shell/types').Completion} Completion */
/** @typedef {(input: string, cursor: number) => Promise<Completion>} Completer */

/** @typedef {import('../editor/types').EditOp} EditOp */

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
 * @property {EditorState} editor
 * @property {{ entries: string[], nav: Navigation }} history
 * @property {boolean} busy
 * @property {number} lastExitCode
 * @property {SearchState | null} search
 * @property {number} columns
 */

/**
 * @typedef {object} TerminalActions
 * @property {(text: string) => void} typeText
 * @property {(op: EditOp) => void} applyEdit
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

/**
 * @typedef {object} TerminalOptions
 * @property {(hooks: ShellHooks) => Shell} makeShell
 * @property {HistoryStorage} storage
 * @property {string} home
 * @property {string} [user]
 * @property {string} [host]
 * @property {(url: string) => void} [openUrl]
 * @property {Completer} [complete]
 */

const HISTORY_KEY = 'gnikolaos:terminal:history'
const DEFAULT_COLUMNS = 80

/**
 * @param {number} exitCode
 * @returns {PromptStatus}
 */
const statusOf = (exitCode) => (exitCode === 0 ? 'ok' : 'error')

/**
 * @param {EditorState} a
 * @param {EditorState} b
 * @returns {boolean}
 */
const sameEditor = (a, b) => a.input === b.input && a.cursor === b.cursor

/**
 * @param {EditorState} editor
 * @param {Completion} completion
 * @param {string} replacement
 * @returns {EditorState}
 */
const replaceWord = ({ input }, { start, end }, replacement) =>
    insert({ input: input.slice(0, start) + input.slice(end), cursor: start }, replacement)

/**
 * @param {string} candidate
 * @returns {string}
 */
const completedWord = (candidate) => escapeWord(candidate) + (candidate.endsWith('/') ? '' : ' ')

/**
 * @param {readonly string[]} entries
 * @param {string} draft
 * @param {string} query
 * @param {number} fromIndex
 * @returns {{ search: SearchState, editor: EditorState }}
 */
const searchFrom = (entries, draft, query, fromIndex) => {
    const index = searchHistory(entries, query, fromIndex)
    if (index === null) return { search: { query, index, draft }, editor: createEditorFromText(draft) }
    const entry = entries[index]
    return {
        search: { query, index, draft },
        editor: { input: entry, cursor: entry.lastIndexOf(query) + query.length },
    }
}

/** @type {Completer} */
const completeNothing = async (_input, cursor) => ({ start: cursor, end: cursor, candidates: [] })

/** @returns {HistoryStorage} */
const browserStorage = () => {
    try {
        return globalThis.sessionStorage ?? createMemoryStorage()
    } catch {
        return createMemoryStorage()
    }
}

/**
 * @param {string} url
 * @returns {void}
 */
const openInNewTab = (url) => void window.open(url, '_blank', 'noopener,noreferrer')

/**
 * @param {TerminalOptions} options
 * @returns {{ state: TerminalState, actions: TerminalActions }}
 */
const createTerminal = ({
    makeShell,
    storage,
    home,
    user = profile.user,
    host = profile.host,
    openUrl = openInNewTab,
    complete: completer = completeNothing,
}) => {
    /** @type {[TerminalState, import('solid-js/store').SetStoreFunction<TerminalState>]} */
    const [state, setState] = createStore({
        session: { user, host, cwd: home },
        blocks: /** @type {Block[]} */ ([]),
        editor: createEmptyEditor(),
        history: { entries: loadHistory(storage, HISTORY_KEY), nav: createNavigation() },
        busy: false,
        lastExitCode: 0,
        search: /** @type {SearchState | null} */ (null),
        columns: DEFAULT_COLUMNS,
    })

    let nextId = 1
    /** @type {(path: string) => void} */
    let navigateFn = () => {}
    /** @type {{ controller: AbortController, promptId: number, openPlainId: number | null } | null} */
    let current = null
    /** @type {EditorState | null} */
    let afterLastComplete = null

    const shell = makeShell({
        getCwd: () => state.session.cwd,
        setCwd: (absPath) => setState('session', 'cwd', absPath),
        getHistory: () => state.history.entries,
        navigate: (path) => navigateFn(path),
        openUrl,
    })

    /**
     * @param {Block} block
     * @returns {void}
     */
    const pushBlock = (block) => setState('blocks', state.blocks.length, block)

    /**
     * @param {string} input
     * @param {{ running?: boolean }} [options]
     * @returns {number}
     */
    const pushPrompt = (input, { running = false } = {}) => {
        const id = nextId++
        pushBlock({ id, kind: 'prompt', cwd: state.session.cwd, input, status: statusOf(state.lastExitCode), running })
        return id
    }

    /**
     * @param {OutputContent['kind']} kind
     * @param {string} content
     * @returns {number}
     */
    const pushOutput = (kind, content) => {
        const id = nextId++
        pushBlock({ id, kind: 'output', output: { kind, content } })
        return id
    }

    /**
     * @param {NonNullable<typeof current>} run
     * @param {string} text
     * @returns {void}
     */
    const appendPlain = (run, text) => {
        const last = state.blocks.at(-1)
        if (run.openPlainId !== null && last?.id === run.openPlainId && last.kind === 'output') {
            setState('blocks', state.blocks.length - 1, 'output', 'content', (content) => content + text)
            return
        }
        run.openPlainId = pushOutput('plain', text)
    }

    /**
     * @param {number} promptId
     * @param {number} exitCode
     * @returns {void}
     */
    const finish = (promptId, exitCode) => {
        batch(() => {
            setState(
                'blocks',
                produce((blocks) => {
                    const block = blocks.find((candidate) => candidate.id === promptId)
                    if (block?.kind === 'prompt') block.running = false
                }),
            )
            setState({ busy: false, lastExitCode: exitCode })
        })
        current = null
    }

    /**
     * @param {NonNullable<typeof current>} run
     * @returns {Sink}
     */
    const createSink = (run) => {
        const live = () => current === run && !run.controller.signal.aborted
        return {
            stdout: (text) => live() && appendPlain(run, text),
            stderr: (text) => live() && appendPlain(run, text),
            markdown: (content) => {
                if (!live()) return
                pushOutput('markdown', content)
                run.openPlainId = null
            },
            clear: () => {
                if (!live()) return
                setState('blocks', [])
                run.openPlainId = null
            },
        }
    }

    /**
     * @param {string} line
     * @returns {Promise<void>}
     */
    const execute = async (line) => {
        const promptId = pushPrompt(line, { running: true })
        const run = { controller: new AbortController(), promptId, openPlainId: null }
        current = run
        setState('busy', true)
        let exitCode
        try {
            exitCode = (await shell.run(line, createSink(run), run.controller.signal)).exitCode
        } catch {
            exitCode = 1
        }
        if (current === run) finish(promptId, exitCode)
    }

    /**
     * @param {string} query
     * @param {number} fromIndex
     * @returns {void}
     */
    const showSearch = (query, fromIndex) => {
        const { draft } = /** @type {SearchState} */ (state.search)
        const step = searchFrom(state.history.entries, draft, query, fromIndex)
        batch(() => {
            setState('search', step.search)
            setState('editor', step.editor)
        })
    }

    const acceptSearch = () => {
        if (!state.search) return
        batch(() => {
            setState('search', null)
            setState('editor', createEditorFromText(state.editor.input))
        })
    }

    /** @param {string} text */
    const typeText = (text) => {
        if (state.busy || !text) return
        if (state.search) {
            showSearch(state.search.query + text, state.search.index ?? state.history.entries.length - 1)
            return
        }
        setState('editor', insert(state.editor, text))
    }

    /** @param {EditOp} op */
    const applyEdit = (op) => {
        if (state.busy || !Object.hasOwn(lineEditor, op)) return
        if (state.search && op === 'backspace') {
            showSearch(state.search.query.slice(0, -1), state.history.entries.length - 1)
            return
        }
        acceptSearch()
        setState('editor', lineEditor[op](state.editor))
    }

    const submit = async () => {
        if (state.busy) return
        acceptSearch()
        const line = state.editor.input.trim()
        if (!line) {
            batch(() => {
                pushPrompt('')
                setState('editor', createEmptyEditor())
                setState('history', 'nav', createNavigation())
            })
            return
        }
        const entries = appendHistory(state.history.entries, line)
        saveHistory(storage, HISTORY_KEY, entries)
        setState('editor', createEmptyEditor())
        setState('history', { entries, nav: createNavigation() })
        await execute(line)
    }

    /** @param {string} line */
    const runLine = async (line) => {
        if (state.busy) return
        await execute(line)
    }

    /**
     * @param {import('../history/types').NavigationStep | null} step
     * @returns {void}
     */
    const applyHistoryStep = (step) => {
        if (!step) return
        batch(() => {
            setState('history', 'nav', step.nav)
            setState('editor', createEditorFromText(step.input))
        })
    }

    const historyPrev = () => {
        if (state.busy) return
        acceptSearch()
        applyHistoryStep(stepHistoryBack(state.history.nav, state.history.entries, state.editor.input))
    }

    const historyNext = () => {
        if (state.busy) return
        acceptSearch()
        applyHistoryStep(stepHistoryForward(state.history.nav, state.history.entries))
    }

    const cancel = () => {
        if (!state.search) return
        batch(() => {
            setState('editor', createEditorFromText(/** @type {SearchState} */ (state.search).draft))
            setState('search', null)
        })
    }

    const historySearch = () => {
        if (state.busy) return
        if (!state.search) {
            setState('search', { query: '', index: null, draft: state.editor.input })
            return
        }
        const { query, index } = state.search
        const older = searchHistory(state.history.entries, query, (index ?? state.history.entries.length) - 1)
        if (older !== null) showSearch(query, older)
    }

    const interrupt = () => {
        if (state.search) {
            cancel()
            return
        }
        if (current) {
            const run = current
            appendPlain(run, '^C')
            run.controller.abort()
            finish(run.promptId, EXIT_CODES.ABORTED)
            return
        }
        batch(() => {
            pushPrompt(state.editor.input + '^C')
            setState({ editor: createEmptyEditor(), lastExitCode: EXIT_CODES.ABORTED })
            setState('history', 'nav', createNavigation())
        })
    }

    const eof = async () => {
        if (state.busy) return
        acceptSearch()
        if (state.editor.input !== '') return
        await runLine('logout')
    }

    const clearScreen = () => {
        setState('blocks', [])
        if (current) current.openPlainId = null
    }

    /**
     * @param {Completion} completion
     * @param {EditorState} before
     * @returns {void}
     */
    const applyCompletion = (completion, before) => {
        const { candidates } = completion
        if (candidates.length === 1) {
            setState('editor', replaceWord(before, completion, completedWord(candidates[0])))
            return
        }
        if (candidates.length === 0) return
        const prefix = escapeWord(findCommonPrefix(candidates))
        if (prefix !== before.input.slice(completion.start, completion.end)) {
            setState('editor', replaceWord(before, completion, prefix))
            return
        }
        if (!afterLastComplete || !sameEditor(afterLastComplete, before)) return
        batch(() => {
            pushPrompt(before.input)
            pushOutput('plain', formatColumns(candidates.map(formatCandidateName), state.columns))
        })
    }

    const complete = async () => {
        if (state.busy) return
        acceptSearch()
        const before = { ...state.editor }
        let completion
        try {
            completion = await completer(before.input, before.cursor)
        } catch {
            return
        }
        if (state.busy || state.search || !sameEditor(state.editor, before)) return
        applyCompletion(completion, before)
        afterLastComplete = { ...state.editor }
    }

    /** @param {number} columns */
    const setColumns = (columns) => {
        if (columns !== state.columns) setState('columns', columns)
    }

    /** @param {(path: string) => void} fn */
    const setNavigate = (fn) => {
        navigateFn = fn
    }

    return {
        state,
        actions: {
            typeText,
            applyEdit,
            submit,
            historyPrev,
            historyNext,
            interrupt,
            eof,
            clearScreen,
            runLine,
            historySearch,
            acceptSearch,
            cancel,
            complete,
            setColumns,
            setNavigate,
        },
    }
}

const vfs = createVfs(browserIo)
const registry = createRegistry(commands)

const terminal = createTerminal({
    home: vfs.home,
    storage: browserStorage(),
    complete: createCompleter({ fs: vfs, registry, getCwd: () => terminalState.session.cwd }),
    makeShell: (hooks) =>
        createShell({ ...hooks, registry, fs: vfs, session: { user: profile.user, host: profile.host } }),
})

const { state: terminalState, actions } = terminal
const {
    typeText,
    applyEdit,
    submit,
    historyPrev,
    historyNext,
    interrupt,
    eof,
    clearScreen,
    runLine,
    setNavigate,
    complete,
    historySearch,
    acceptSearch,
    cancel,
    setColumns,
} = actions

export {
    createTerminal,
    HISTORY_KEY,
    vfs,
    terminalState,
    typeText,
    applyEdit,
    submit,
    historyPrev,
    historyNext,
    interrupt,
    eof,
    clearScreen,
    runLine,
    setNavigate,
    complete,
    historySearch,
    acceptSearch,
    cancel,
    setColumns,
}
