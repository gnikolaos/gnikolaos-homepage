import { describe, expect, test } from 'vitest'
import { createMemoryStorage } from '@gnikolaos/lib/shared/createMemoryStorage'
import { createTerminal } from './createTerminal'
import { HISTORY_KEY } from './HISTORY_KEY'

/** @import { KeyValueStorage } from '@gnikolaos/lib/shared/types' */
/** @import { Completion, ShellHooks, Sink } from '../shell/types' */

/**
 * @typedef {object} FakeCall
 * @property {string} line
 * @property {Sink} sink
 * @property {AbortSignal} signal
 * @property {(exitCode: number) => void} resolve
 */

/**
 * @typedef {object} SetupOptions
 * @property {KeyValueStorage} [storage]
 * @property {(call: FakeCall) => void} [script]
 * @property {(input: string, cursor: number) => Completion} [complete]
 * @property {string[]} [history]
 */

/** @param {SetupOptions} [options] */
const setup = ({ storage = createMemoryStorage(), script, complete, history } = {}) => {
    if (history) storage.setItem(HISTORY_KEY, JSON.stringify(history))
    /** @type {FakeCall[]} */
    const calls = []
    /** @type {{ input: string, cursor: number }[]} */
    const completeCalls = []
    /** @type {ShellHooks | null} */
    let hooks = null
    const terminal = createTerminal({
        home: '/home/visitor',
        storage,
        openUrl: () => {},
        complete: async (input, cursor) => {
            completeCalls.push({ input, cursor })
            return complete ? complete(input, cursor) : { start: cursor, end: cursor, candidates: [] }
        },
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
    return {
        ...terminal,
        calls,
        completeCalls,
        storage,
        hooks: /** @type {ShellHooks} */ (hooks),
    }
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
    test('pushes a running prompt block, then stops it and records the exit code', async () => {
        const t = setup({ script: (call) => call.resolve(0) })
        const done = typeAndSubmit(t, '  pwd  ')
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'pwd', status: 'ok', running: true },
        ])
        expect(t.state.busy).toBe(true)
        expect(t.state.editor).toEqual({ input: '', cursor: 0 })
        await done
        expect(t.state.blocks[0]).toMatchObject({ status: 'ok', running: false })
        expect(t.state.busy).toBe(false)
        expect(t.state.lastExitCode).toBe(0)
        expect(t.calls[0].line).toBe('pwd')
    })

    test('a failing command keeps its own block ok and marks the next block error', async () => {
        const t = setup({ script: (call) => call.resolve(call.line === 'nope' ? 127 : 0) })
        await typeAndSubmit(t, 'nope')
        expect(t.state.blocks[0]).toMatchObject({ status: 'ok', running: false })
        expect(t.state.lastExitCode).toBe(127)
        await typeAndSubmit(t, 'ls')
        expect(t.state.blocks[1]).toMatchObject({ input: 'ls', status: 'error' })
        expect(t.state.lastExitCode).toBe(0)
        await typeAndSubmit(t, 'pwd')
        expect(t.state.blocks[2]).toMatchObject({ input: 'pwd', status: 'ok' })
    })

    test('an empty line takes the status of the last command and keeps the exit code', async () => {
        const t = setup({ script: (call) => call.resolve(2) })
        await typeAndSubmit(t, 'nope')
        await typeAndSubmit(t, '')
        expect(t.state.blocks.at(-1)).toMatchObject({ input: '', status: 'error', running: false })
        expect(t.state.lastExitCode).toBe(2)
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
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: '', status: 'ok', running: false },
        ])
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
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'slow', status: 'ok', running: false },
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
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'ech^C', status: 'ok', running: false },
        ])
        expect(t.state.editor).toEqual({ input: '', cursor: 0 })
        expect(t.state.history.entries).toEqual([])
        expect(t.calls).toHaveLength(0)
    })

    test('while idle sets the exit code to 130 so the next prompt is error', async () => {
        const t = setup()
        t.actions.interrupt()
        expect(t.state.lastExitCode).toBe(130)
        await typeAndSubmit(t, '')
        expect(t.state.blocks[1]).toMatchObject({ input: '', status: 'error' })
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
        expect(t.state.blocks[0]).toMatchObject({ status: 'ok', running: false })
        expect(t.state.busy).toBe(false)
        expect(t.state.lastExitCode).toBe(1)
    })
})

/**
 * @param {string[]} candidates
 * @returns {(input: string) => Completion}
 */
const lastWord = (candidates) => (input) => ({ start: input.lastIndexOf(' ') + 1, end: input.length, candidates })

describe('complete', () => {
    test('passes the editor input and cursor to the completer', async () => {
        const t = setup()
        t.actions.typeText('cat po')
        t.actions.applyEdit('moveLeft')
        await t.actions.complete()
        expect(t.completeCalls).toEqual([{ input: 'cat po', cursor: 5 }])
    })

    test('a single file candidate replaces the word and adds a space', async () => {
        const t = setup({ complete: lastWord(['about.md']) })
        t.actions.typeText('cat ab')
        await t.actions.complete()
        expect(t.state.editor).toEqual({ input: 'cat about.md ', cursor: 13 })
    })

    test('a single directory candidate adds no space', async () => {
        const t = setup({ complete: lastWord(['~/posts/']) })
        t.actions.typeText('cd ~/po')
        await t.actions.complete()
        expect(t.state.editor).toEqual({ input: 'cd ~/posts/', cursor: 11 })
    })

    test('replaces only the word range and keeps the text after it', async () => {
        const t = setup({ complete: () => ({ start: 3, end: 5, candidates: ['posts/'] }) })
        t.actions.typeText('ls po | wc')
        t.actions.applyEdit('moveHome')
        await t.actions.complete()
        expect(t.state.editor).toEqual({ input: 'ls posts/ | wc', cursor: 9 })
    })

    test('escapes the inserted candidate', async () => {
        const t = setup({ complete: lastWord(["my post's.md"]) })
        t.actions.typeText('cat my')
        await t.actions.complete()
        expect(t.state.editor.input).toBe("cat my\\ post\\'s.md ")
    })

    test('several candidates insert their longer common prefix without a suffix', async () => {
        const t = setup({ complete: lastWord(['post one.md', 'post two.md']) })
        t.actions.typeText('cat p')
        await t.actions.complete()
        expect(t.state.editor).toEqual({ input: 'cat post\\ ', cursor: 10 })
        expect(t.state.blocks).toEqual([])
    })

    test('no candidates leave the editor alone', async () => {
        const t = setup()
        t.actions.typeText('zz')
        await t.actions.complete()
        expect(t.state.editor).toEqual({ input: 'zz', cursor: 2 })
        expect(t.state.blocks).toEqual([])
    })

    test('a second Tab without progress lists the candidates in columns', async () => {
        const storage = createMemoryStorage()
        const t = setup({ storage, complete: lastWord(['posts/', 'pics/', 'p.md']) })
        t.actions.typeText('ls p')
        await t.actions.complete()
        expect(t.state.blocks).toEqual([])
        t.actions.setColumns(20)
        await t.actions.complete()
        expect(t.state.blocks).toEqual([
            { id: 1, kind: 'prompt', cwd: '/home/visitor', input: 'ls p', status: 'ok', running: false },
            { id: 2, kind: 'output', output: { kind: 'plain', content: 'posts/  pics/  p.md\n' } },
        ])
        expect(t.state.editor).toEqual({ input: 'ls p', cursor: 4 })
        expect(t.state.history.entries).toEqual([])
        expect(storage.getItem(HISTORY_KEY)).toBeNull()
    })

    test('lists display names, wrapped to the column width', async () => {
        const t = setup({ complete: lastWord(['~/posts/a.md', '~/posts/b.md', '~/posts/c/']) })
        t.actions.typeText('cat ~/posts/')
        t.actions.setColumns(10)
        await t.actions.complete()
        await t.actions.complete()
        expect(t.state.blocks[1]).toMatchObject({ output: { content: 'a.md  c/\nb.md\n' } })
    })

    test('a Tab right after a prefix insertion lists on the next Tab', async () => {
        const t = setup({ complete: lastWord(['post-1.md', 'post-2.md']) })
        t.actions.typeText('cat p')
        await t.actions.complete()
        expect(t.state.editor.input).toBe('cat post-')
        await t.actions.complete()
        expect(t.state.blocks).toHaveLength(2)
    })

    test('an editor change in between restarts the double Tab', async () => {
        const t = setup({ complete: lastWord(['posts/', 'pics/']) })
        t.actions.typeText('ls p')
        await t.actions.complete()
        t.actions.applyEdit('moveLeft')
        await t.actions.complete()
        expect(t.state.blocks).toEqual([])
        await t.actions.complete()
        expect(t.state.blocks).toHaveLength(2)
    })

    test('ignores a result when the editor changed while completing', async () => {
        /** @type {(completion: Completion) => void} */
        let resolve = () => {}
        const t = createTerminal({
            home: '/home/visitor',
            storage: createMemoryStorage(),
            makeShell: () => ({ run: async () => ({ exitCode: 0 }) }),
            complete: () => new Promise((r) => (resolve = r)),
        })
        t.actions.typeText('cat ab')
        const done = t.actions.complete()
        t.actions.typeText('c')
        resolve({ start: 4, end: 6, candidates: ['about.md'] })
        await done
        expect(t.state.editor.input).toBe('cat abc')
    })

    test('a throwing completer is ignored', async () => {
        const t = setup({
            complete: () => {
                throw new Error('boom')
            },
        })
        t.actions.typeText('ls')
        await t.actions.complete()
        expect(t.state.editor.input).toBe('ls')
    })

    test('is ignored while busy', async () => {
        const t = setup({ complete: lastWord(['ls']) })
        typeAndSubmit(t, 'slow')
        await t.actions.complete()
        expect(t.completeCalls).toEqual([])
        expect(t.state.editor.input).toBe('')
    })
})

describe('setColumns', () => {
    test('defaults to 80 and stores the measured width', () => {
        const t = setup()
        expect(t.state.columns).toBe(80)
        t.actions.setColumns(42)
        expect(t.state.columns).toBe(42)
    })
})

describe('historySearch', () => {
    const history = ['ls posts', 'cat about.md', 'cd posts', 'pwd']

    test('enters search with the current input as draft', () => {
        const t = setup({ history })
        t.actions.typeText('dra')
        t.actions.historySearch()
        expect(t.state.search).toEqual({ query: '', index: null, draft: 'dra' })
        expect(t.state.editor).toEqual({ input: 'dra', cursor: 3 })
    })

    test('typing searches backwards and puts the cursor after the last occurrence', () => {
        const t = setup({ history: [...history, 'cat posts/posts.md'] })
        t.actions.historySearch()
        t.actions.typeText('pos')
        expect(t.state.search).toEqual({ query: 'pos', index: 4, draft: '' })
        expect(t.state.editor).toEqual({ input: 'cat posts/posts.md', cursor: 13 })
    })

    test('typing keeps the current entry while it still matches', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.typeText('p')
        expect(t.state.search?.index).toBe(3)
        t.actions.typeText('o')
        expect(t.state.search?.index).toBe(2)
        t.actions.typeText('s')
        expect(t.state.search?.index).toBe(2)
    })

    test('no match shows the draft and clears the index', () => {
        const t = setup({ history })
        t.actions.typeText('dra')
        t.actions.historySearch()
        t.actions.typeText('xyz')
        expect(t.state.search).toEqual({ query: 'xyz', index: null, draft: 'dra' })
        expect(t.state.editor).toEqual({ input: 'dra', cursor: 3 })
    })

    test('Ctrl+R again finds an older match and stays on the oldest', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.typeText('posts')
        expect(t.state.search?.index).toBe(2)
        t.actions.historySearch()
        expect(t.state.search?.index).toBe(0)
        expect(t.state.editor).toEqual({ input: 'ls posts', cursor: 8 })
        t.actions.historySearch()
        expect(t.state.search?.index).toBe(0)
        expect(t.state.editor.input).toBe('ls posts')
    })

    test('Ctrl+R with an empty query stays empty', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.historySearch()
        expect(t.state.search).toEqual({ query: '', index: null, draft: '' })
    })

    test('backspace shortens the query and searches again from the newest entry', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.typeText('posts')
        t.actions.historySearch()
        expect(t.state.search?.index).toBe(0)
        t.actions.applyEdit('backspace')
        expect(t.state.search).toEqual({ query: 'post', index: 2, draft: '' })
        t.actions.applyEdit('backspace')
        t.actions.applyEdit('backspace')
        t.actions.applyEdit('backspace')
        t.actions.applyEdit('backspace')
        expect(t.state.search).toEqual({ query: '', index: null, draft: '' })
        expect(t.state.editor.input).toBe('')
    })

    test('another edit accepts the match, then applies the edit', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.typeText('cat')
        t.actions.applyEdit('moveLeft')
        expect(t.state.search).toBeNull()
        expect(t.state.editor).toEqual({ input: 'cat about.md', cursor: 11 })
    })

    test('submit accepts and runs the matched entry', async () => {
        const t = setup({ history, script: (call) => call.resolve(0) })
        t.actions.historySearch()
        t.actions.typeText('cd')
        await t.actions.submit()
        expect(t.state.search).toBeNull()
        expect(t.calls.map((call) => call.line)).toEqual(['cd posts'])
        expect(t.state.history.entries.at(-1)).toBe('cd posts')
    })

    test('history navigation accepts first', () => {
        const t = setup({ history })
        t.actions.historySearch()
        t.actions.typeText('cat')
        t.actions.historyNext()
        expect(t.state.search).toBeNull()
        expect(t.state.editor).toEqual({ input: 'cat about.md', cursor: 12 })
    })

    test('Tab accepts and then completes', async () => {
        const t = setup({ history, complete: lastWord(['posts/']) })
        t.actions.historySearch()
        t.actions.typeText('cd')
        await t.actions.complete()
        expect(t.state.search).toBeNull()
        expect(t.state.editor.input).toBe('cd posts/')
    })

    test('is ignored while busy', () => {
        const t = setup({ history })
        typeAndSubmit(t, 'slow')
        t.actions.historySearch()
        expect(t.state.search).toBeNull()
    })
})

describe('acceptSearch', () => {
    test('keeps the found entry with the cursor at the end and leaves search', () => {
        const t = setup({ history: ['ls posts'] })
        t.actions.typeText('dra')
        t.actions.historySearch()
        t.actions.typeText('ls')
        t.actions.acceptSearch()
        expect(t.state.search).toBeNull()
        expect(t.state.editor).toEqual({ input: 'ls posts', cursor: 8 })
        expect(t.state.blocks).toEqual([])
    })

    test('is a no-op when not searching', () => {
        const t = setup()
        t.actions.typeText('ls')
        t.actions.acceptSearch()
        expect(t.state.editor).toEqual({ input: 'ls', cursor: 2 })
    })
})

describe('cancel', () => {
    test('restores the draft and leaves search without a prompt block', () => {
        const t = setup({ history: ['ls posts'] })
        t.actions.typeText('dra')
        t.actions.historySearch()
        t.actions.typeText('ls')
        t.actions.cancel()
        expect(t.state.search).toBeNull()
        expect(t.state.editor).toEqual({ input: 'dra', cursor: 3 })
        expect(t.state.blocks).toEqual([])
    })

    test('Ctrl+C while searching cancels the same way', () => {
        const t = setup({ history: ['ls posts'] })
        t.actions.historySearch()
        t.actions.typeText('ls')
        t.actions.interrupt()
        expect(t.state.search).toBeNull()
        expect(t.state.editor.input).toBe('')
        expect(t.state.blocks).toEqual([])
        expect(t.state.lastExitCode).toBe(0)
    })

    test('is a no-op when not searching', () => {
        const t = setup()
        t.actions.typeText('ls')
        t.actions.cancel()
        expect(t.state.editor).toEqual({ input: 'ls', cursor: 2 })
        expect(t.state.blocks).toEqual([])
    })
})
