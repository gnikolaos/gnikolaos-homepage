import { describe, expect, test } from 'vitest'
import { createMemoryStorage, createTerminal, HISTORY_KEY } from './terminalStore'

/** @typedef {import('../shell/shell').Sink} Sink */

/**
 * @typedef {object} FakeCall
 * @property {string} line
 * @property {Sink} sink
 * @property {AbortSignal} signal
 * @property {(exitCode: number) => void} resolve
 */

/**
 * @param {{ storage?: import('../history/history').HistoryStorage, script?: (call: FakeCall) => void }} [options]
 */
const setup = ({ storage = createMemoryStorage(), script } = {}) => {
    /** @type {FakeCall[]} */
    const calls = []
    /** @type {import('./terminalStore').ShellHooks | null} */
    let hooks = null
    const terminal = createTerminal({
        home: '/home/visitor',
        storage,
        openUrl: () => {},
        makeShell: (shellHooks) => {
            hooks = shellHooks
            return {
                run: (line, sink, signal) =>
                    new Promise((resolve) => {
                        const call = { line, sink, signal, resolve: (exitCode) => resolve({ exitCode }) }
                        calls.push(call)
                        script?.(call)
                    }),
            }
        },
    })
    return { ...terminal, calls, storage, hooks: /** @type {import('./terminalStore').ShellHooks} */ (hooks) }
}

/**
 * @param {ReturnType<typeof setup>} t
 * @param {string} text
 */
const typeAndSubmit = (t, text) => {
    t.actions.typeText(text)
    return t.actions.submit()
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('typeText and applyEdit', () => {
    test('typing inserts at the cursor', () => {
        const t = setup()
        t.actions.typeText('lss')
        t.actions.applyEdit('moveLeft')
        t.actions.applyEdit('backspace')
        expect(t.state.editor).toEqual({ input: 'ls', cursor: 1 })
    })

    test('unknown edit ops are ignored', () => {
        const t = setup()
        t.actions.typeText('ls')
        t.actions.applyEdit(/** @type {any} */ ('insert'))
        expect(t.state.editor).toEqual({ input: 'ls', cursor: 2 })
    })
})

describe('submit', () => {
    test('pushes a running prompt block, then sets ok status from the exit code', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        const done = typeAndSubmit(t, '  pwd  ')
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'pwd', status: 'running' },
        ])
        expect(t.state.busy).toBe(true)
        expect(t.state.editor).toEqual({ input: '', cursor: 0 })
        await done
        expect(t.state.blocks[0]).toMatchObject({ status: 'ok' })
        expect(t.state.busy).toBe(false)
        expect(t.state.lastExitCode).toBe(0)
        expect(t.calls[0].line).toBe('pwd')
    })

    test('non-zero exit marks the block as error', async () => {
        const t = setup({ script: (call) => call.resolve(127) })
        await typeAndSubmit(t, 'nope')
        expect(t.state.blocks[0]).toMatchObject({ status: 'error' })
        expect(t.state.lastExitCode).toBe(127)
    })

    test('merges consecutive stdout and stderr chunks into one plain block', async () => {
        const t = setup({
            script: (call) => {
                call.sink.stdout('a\n')
                call.sink.stderr('b\n')
                call.sink.stdout('c\n')
                call.resolve(0)
            },
        })
        await typeAndSubmit(t, 'ls')
        expect(t.state.blocks.slice(1)).toEqual([
            { id: 2, kind: 'output', output: { kind: 'plain', content: 'a\nb\nc\n' } },
        ])
    })

    test('markdown starts a new block and closes the plain one', async () => {
        const t = setup({
            script: (call) => {
                call.sink.stdout('a\n')
                call.sink.markdown('# One')
                call.sink.markdown('# Two')
                call.sink.stdout('b\n')
                call.resolve(0)
            },
        })
        await typeAndSubmit(t, 'cat')
        expect(t.state.blocks.slice(1).map((block) => block.kind === 'output' && block.output)).toEqual([
            { kind: 'plain', content: 'a\n' },
            { kind: 'markdown', content: '# One' },
            { kind: 'markdown', content: '# Two' },
            { kind: 'plain', content: 'b\n' },
        ])
    })

    test('output of separate commands goes to separate blocks', async () => {
        const t = setup({
            script: (call) => {
                call.sink.stdout(call.line + '\n')
                call.resolve(0)
            },
        })
        await typeAndSubmit(t, 'one')
        await typeAndSubmit(t, 'two')
        expect(t.state.blocks.map((block) => block.kind)).toEqual(['prompt', 'output', 'prompt', 'output'])
    })

    test('empty input pushes an empty prompt block without running', async () => {
        const t = setup()
        await typeAndSubmit(t, '   ')
        expect(t.state.blocks).toEqual([{ id: 1, kind: 'prompt', cwd: '/home/visitor', input: '', status: 'ok' }])
        expect(t.calls).toHaveLength(0)
        expect(t.state.history.entries).toEqual([])
        expect(t.state.editor.input).toBe('')
    })

    test('clear from the shell empties blocks', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        await typeAndSubmit(t, 'one')
        t.calls.length = 0
        const done = typeAndSubmit(t, 'clear')
        t.calls[0].sink.clear()
        t.calls[0].resolve(0)
        await done
        expect(t.state.blocks).toEqual([])
        expect(t.state.busy).toBe(false)
    })

    test('setCwd from the shell updates the session cwd used by the next prompt', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        t.hooks.setCwd('/home/visitor/posts')
        await typeAndSubmit(t, 'ls')
        expect(t.hooks.getCwd()).toBe('/home/visitor/posts')
        expect(t.state.blocks[0]).toMatchObject({ cwd: '/home/visitor/posts' })
    })

    test('navigate hook calls the function given to setNavigate', () => {
        const t = setup()
        /** @type {string[]} */
        const paths = []
        t.actions.setNavigate((path) => paths.push(path))
        t.hooks.navigate('/')
        expect(paths).toEqual(['/'])
    })
})

describe('busy gating', () => {
    test('editing, history, submit and eof are ignored while busy', async () => {
        const t = setup()
        const done = typeAndSubmit(t, 'slow')
        t.actions.typeText('x')
        t.actions.applyEdit('backspace')
        t.actions.historyPrev()
        await t.actions.submit()
        await t.actions.eof()
        expect(t.state.editor).toEqual({ input: '', cursor: 0 })
        expect(t.calls).toHaveLength(1)
        t.calls[0].resolve(0)
        await done
        t.actions.typeText('x')
        expect(t.state.editor.input).toBe('x')
    })
})

describe('history', () => {
    test('submit appends to history and persists it', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        await typeAndSubmit(t, 'ls')
        await typeAndSubmit(t, 'pwd')
        expect(t.state.history.entries).toEqual(['ls', 'pwd'])
        expect(JSON.parse(/** @type {string} */ (t.storage.getItem(HISTORY_KEY)))).toEqual(['ls', 'pwd'])
    })

    test('loads persisted history on creation', () => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, JSON.stringify(['ls', 'cd posts']))
        const t = setup({ storage })
        expect(t.state.history.entries).toEqual(['ls', 'cd posts'])
        expect(t.hooks.getHistory()).toEqual(['ls', 'cd posts'])
    })

    test('prev and next walk entries and restore the draft', () => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, JSON.stringify(['ls', 'pwd']))
        const t = setup({ storage })
        t.actions.typeText('dra')
        t.actions.historyPrev()
        expect(t.state.editor).toEqual({ input: 'pwd', cursor: 3 })
        t.actions.historyPrev()
        expect(t.state.editor.input).toBe('ls')
        t.actions.historyPrev()
        expect(t.state.editor.input).toBe('ls')
        t.actions.historyNext()
        expect(t.state.editor.input).toBe('pwd')
        t.actions.historyNext()
        expect(t.state.editor).toEqual({ input: 'dra', cursor: 3 })
        expect(t.state.history.nav).toEqual({ index: null, draft: '' })
        t.actions.historyNext()
        expect(t.state.editor.input).toBe('dra')
    })

    test('submit resets navigation', async () => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, JSON.stringify(['ls']))
        const t = setup({ storage, script: (call) => call.resolve(0) })
        t.actions.historyPrev()
        await t.actions.submit()
        expect(t.state.history.nav).toEqual({ index: null, draft: '' })
        expect(t.state.history.entries).toEqual(['ls'])
    })
})

describe('interrupt', () => {
    test('while busy aborts, appends ^C to the output and frees the prompt', async () => {
        const t = setup({ script: (call) => call.sink.stdout('partial\n') })
        const done = typeAndSubmit(t, 'slow')
        t.actions.interrupt()
        expect(t.calls[0].signal.aborted).toBe(true)
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'slow', status: 'error' },
            { id: 2, kind: 'output', output: { kind: 'plain', content: 'partial\n^C' } },
        ])
        expect(t.state.busy).toBe(false)
        expect(t.state.lastExitCode).toBe(130)
        t.calls[0].sink.stdout('late\n')
        t.calls[0].resolve(0)
        await done
        expect(t.state.blocks).toHaveLength(2)
        expect(t.state.lastExitCode).toBe(130)
    })

    test('while busy with no output yet creates a ^C block', () => {
        const t = setup()
        typeAndSubmit(t, 'slow')
        t.actions.interrupt()
        expect(t.state.blocks[1]).toEqual({ id: 2, kind: 'output', output: { kind: 'plain', content: '^C' } })
    })

    test('while idle echoes the input with ^C and clears the editor without history', () => {
        const t = setup()
        t.actions.typeText('ech')
        t.actions.interrupt()
        expect(t.state.blocks).toEqual([{ id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'ech^C', status: 'ok' }])
        expect(t.state.editor).toEqual({ input: '', cursor: 0 })
        expect(t.state.history.entries).toEqual([])
        expect(t.calls).toHaveLength(0)
    })
})

describe('eof', () => {
    test('on an empty line runs logout', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        await t.actions.eof()
        expect(t.calls.map((call) => call.line)).toEqual(['logout'])
        expect(t.state.blocks[0]).toMatchObject({ input: 'logout', status: 'ok' })
        expect(t.state.history.entries).toEqual([])
    })

    test('with input is a no-op', async () => {
        const t = setup()
        t.actions.typeText('ls')
        await t.actions.eof()
        expect(t.calls).toHaveLength(0)
        expect(t.state.blocks).toEqual([])
    })
})

describe('clearScreen', () => {
    test('empties blocks and keeps the editor', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        await typeAndSubmit(t, 'ls')
        t.actions.typeText('pw')
        t.actions.clearScreen()
        expect(t.state.blocks).toEqual([])
        expect(t.state.editor).toEqual({ input: 'pw', cursor: 2 })
    })

    test('output after clearing while busy starts a fresh block', async () => {
        const t = setup()
        const done = typeAndSubmit(t, 'slow')
        t.calls[0].sink.stdout('a\n')
        t.actions.clearScreen()
        t.calls[0].sink.stdout('b\n')
        t.calls[0].resolve(0)
        await done
        expect(t.state.blocks).toEqual([{ id: 3, kind: 'output', output: { kind: 'plain', content: 'b\n' } }])
    })
})

describe('runLine', () => {
    test('runs like submit without touching history or the editor', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        t.actions.typeText('draft')
        await t.actions.runLine('cd ~/posts')
        expect(t.calls.map((call) => call.line)).toEqual(['cd ~/posts'])
        expect(t.state.blocks[0]).toMatchObject({ kind: 'prompt', input: 'cd ~/posts', status: 'ok' })
        expect(t.state.history.entries).toEqual([])
        expect(t.state.editor.input).toBe('draft')
        expect(t.storage.getItem(HISTORY_KEY)).toBeNull()
    })

    test('is ignored while busy', async () => {
        const t = setup()
        typeAndSubmit(t, 'slow')
        await t.actions.runLine('ls')
        await flush()
        expect(t.calls).toHaveLength(1)
    })

    test('a throwing shell ends the run with exit 1', async () => {
        const t = createTerminal({
            home: '/home/visitor',
            storage: createMemoryStorage(),
            makeShell: () => ({ run: () => Promise.reject(new Error('boom')) }),
        })
        await t.actions.runLine('x')
        expect(t.state.blocks[0]).toMatchObject({ status: 'error' })
        expect(t.state.busy).toBe(false)
        expect(t.state.lastExitCode).toBe(1)
    })
})
