import { batch } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import * as lineEditor from '../editor/lineEditor'
import { appendHistory, createNavigation, historyDown, historyUp, loadHistory, saveHistory } from '../history/history'
import { createVfs } from '../fs/vfs'
import { browserIo } from '../fs/manifest'
import { createRegistry } from '../shell/registry'
import { createShell } from '../shell/shell'
import { commands } from '../shell/commands/index'
import profile from '../profile'

/** @typedef {import('../shell/shell').Shell} Shell */
/** @typedef {import('../shell/shell').Sink} Sink */
/** @typedef {import('../history/history').HistoryStorage} HistoryStorage */
/** @typedef {import('../history/history').Navigation} Navigation */
/** @typedef {import('../editor/lineEditor').EditorState} EditorState */

/**
 * @typedef {'moveLeft' | 'moveRight' | 'moveHome' | 'moveEnd' | 'moveWordLeft' | 'moveWordRight'
 *     | 'backspace' | 'deleteForward' | 'killWord' | 'killToEnd' | 'clearLine'} EditOp
 */

/** @typedef {'running' | 'ok' | 'error'} PromptStatus */
/** @typedef {{ id: number, kind: 'prompt', cwd: string, input: string, status: PromptStatus }} PromptBlock */
/** @typedef {{ kind: 'plain' | 'markdown', content: string }} OutputContent */
/** @typedef {{ id: number, kind: 'output', output: OutputContent }} OutputBlock */
/** @typedef {PromptBlock | OutputBlock} Block */

/**
 * @typedef {object} TerminalState
 * @property {{ user: string, host: string, cwd: string }} session
 * @property {Block[]} blocks
 * @property {EditorState} editor
 * @property {{ entries: string[], nav: Navigation }} history
 * @property {boolean} busy
 * @property {number} lastExitCode
 */

/**
 * @typedef {object} ShellHooks
 * @property {() => string} getCwd
 * @property {(absPath: string) => void} setCwd
 * @property {() => readonly string[]} getHistory
 * @property {(path: string) => void} navigate
 * @property {(url: string) => void} openUrl
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
 */

/**
 * @typedef {object} TerminalOptions
 * @property {(hooks: ShellHooks) => Shell} makeShell
 * @property {HistoryStorage} storage
 * @property {string} home
 * @property {string} [user]
 * @property {string} [host]
 * @property {(url: string) => void} [openUrl]
 */

const HISTORY_KEY = 'gnikolaos:terminal:history'
const EXIT_INTERRUPTED = 130

/** @type {Record<EditOp, (s: EditorState) => EditorState>} */
const editOps = {
    moveLeft: lineEditor.moveLeft,
    moveRight: lineEditor.moveRight,
    moveHome: lineEditor.moveHome,
    moveEnd: lineEditor.moveEnd,
    moveWordLeft: lineEditor.moveWordLeft,
    moveWordRight: lineEditor.moveWordRight,
    backspace: lineEditor.backspace,
    deleteForward: lineEditor.deleteForward,
    killWord: lineEditor.killWord,
    killToEnd: lineEditor.killToEnd,
    clearLine: lineEditor.clearLine,
}

/**
 * @param {number} exitCode
 * @returns {PromptStatus}
 */
const statusOf = (exitCode) => (exitCode === 0 ? 'ok' : 'error')

/** @returns {HistoryStorage} */
const createMemoryStorage = () => {
    const items = new Map()
    return {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => void items.set(key, String(value)),
        removeItem: (key) => void items.delete(key),
    }
}

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
}) => {
    /** @type {[TerminalState, import('solid-js/store').SetStoreFunction<TerminalState>]} */
    const [state, setState] = createStore({
        session: { user, host, cwd: home },
        blocks: /** @type {Block[]} */ ([]),
        editor: lineEditor.empty(),
        history: { entries: loadHistory(storage, HISTORY_KEY), nav: createNavigation() },
        busy: false,
        lastExitCode: 0,
    })

    let nextId = 1
    /** @type {(path: string) => void} */
    let navigateFn = () => {}
    /** @type {{ controller: AbortController, promptId: number, openPlainId: number | null } | null} */
    let current = null

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
     * @param {string} cwd
     * @param {string} input
     * @param {PromptStatus} status
     * @returns {number}
     */
    const pushPrompt = (cwd, input, status) => {
        const id = nextId++
        pushBlock({ id, kind: 'prompt', cwd, input, status })
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
                    if (block?.kind === 'prompt') block.status = statusOf(exitCode)
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
        const promptId = pushPrompt(state.session.cwd, line, 'running')
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

    /** @param {string} text */
    const typeText = (text) => {
        if (state.busy || !text) return
        setState('editor', lineEditor.insert(state.editor, text))
    }

    /** @param {EditOp} op */
    const applyEdit = (op) => {
        if (state.busy || !Object.hasOwn(editOps, op)) return
        setState('editor', editOps[op](state.editor))
    }

    const submit = async () => {
        if (state.busy) return
        const line = state.editor.input.trim()
        if (!line) {
            batch(() => {
                pushPrompt(state.session.cwd, '', statusOf(state.lastExitCode))
                setState('editor', lineEditor.empty())
                setState('history', 'nav', createNavigation())
            })
            return
        }
        const entries = appendHistory(state.history.entries, line)
        saveHistory(storage, HISTORY_KEY, entries)
        setState('editor', lineEditor.empty())
        setState('history', { entries, nav: createNavigation() })
        await execute(line)
    }

    /** @param {string} line */
    const runLine = async (line) => {
        if (state.busy) return
        await execute(line)
    }

    /**
     * @param {import('../history/history').NavigationStep | null} step
     * @returns {void}
     */
    const applyHistoryStep = (step) => {
        if (!step) return
        batch(() => {
            setState('history', 'nav', step.nav)
            setState('editor', lineEditor.fromText(step.input))
        })
    }

    const historyPrev = () => {
        if (state.busy) return
        applyHistoryStep(historyUp(state.history.nav, state.history.entries, state.editor.input))
    }

    const historyNext = () => {
        if (state.busy) return
        applyHistoryStep(historyDown(state.history.nav, state.history.entries))
    }

    const interrupt = () => {
        if (current) {
            const run = current
            appendPlain(run, '^C')
            run.controller.abort()
            finish(run.promptId, EXIT_INTERRUPTED)
            return
        }
        batch(() => {
            pushPrompt(state.session.cwd, state.editor.input + '^C', statusOf(state.lastExitCode))
            setState('editor', lineEditor.empty())
            setState('history', 'nav', createNavigation())
        })
    }

    const eof = async () => {
        if (state.busy || state.editor.input !== '') return
        await runLine('logout')
    }

    const clearScreen = () => {
        setState('blocks', [])
        if (current) current.openPlainId = null
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
            setNavigate,
        },
    }
}

const vfs = createVfs(browserIo)
const registry = createRegistry(commands)

const terminal = createTerminal({
    home: vfs.home,
    storage: browserStorage(),
    makeShell: (hooks) =>
        createShell({ ...hooks, registry, fs: vfs, session: { user: profile.user, host: profile.host } }),
})

const { state: terminalState, actions } = terminal
const { typeText, applyEdit, submit, historyPrev, historyNext, interrupt, eof, clearScreen, runLine, setNavigate } =
    actions

export {
    createTerminal,
    createMemoryStorage,
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
}
