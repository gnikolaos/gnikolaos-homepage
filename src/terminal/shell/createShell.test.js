import { describe, expect, test, vi } from 'vitest'
import { defineFakeCommand } from '@test/defineFakeCommand'
import { createRegistry } from './createRegistry'
import { createShell } from './createShell'

/** @import { Ctx, ShellDeps } from './types' */

const createRecordingSink = () => {
    /** @type {Array<[string, string?]>} */
    const events = []
    /** @param {string} type */
    const recorder = (type) => (/** @type {string} */ text) => {
        events.push([type, text])
    }
    return {
        events,
        stdout: recorder('stdout'),
        stderr: recorder('stderr'),
        markdown: recorder('markdown'),
        clear: () => {
            events.push(['clear'])
        },
    }
}

const createDeferred = () => {
    /** @type {() => void} */
    let resolve = () => {}
    const promise = new Promise((r) => (resolve = () => r(undefined)))
    return { promise, resolve }
}

const commands = [
    defineFakeCommand('echo', { run: (ctx, argv) => ctx.stdout(argv.join(' ') + '\n') }),
    defineFakeCommand('upper', { run: (ctx, _argv, stdin) => ctx.stdout((stdin ?? '').toUpperCase()) }),
    defineFakeCommand('md', { run: (ctx, argv) => ctx.markdown(`# ${argv.join(' ')}\n`) }),
    defineFakeCommand('colored', { run: (ctx) => ctx.stdout('\x1b[1;34mposts\x1b[0m\n') }),
    defineFakeCommand('stdin', { run: (ctx, _argv, stdin) => ctx.stdout(JSON.stringify(stdin)) }),
    defineFakeCommand('warn', {
        run: (ctx, _argv, stdin) => {
            ctx.stderr('warn: careful\n')
            ctx.stdout(`warned ${stdin ?? ''}`)
        },
    }),
    defineFakeCommand('code', { run: (_ctx, argv) => Number(argv[0]) }),
    defineFakeCommand('fail', {
        run: () => {
            throw new Error('it broke')
        },
    }),
    defineFakeCommand('wipe', { run: (ctx) => ctx.clear() }),
    defineFakeCommand('async', {
        run: async (ctx) => {
            await Promise.resolve()
            ctx.stdout('later\n')
            return 3
        },
    }),
]

/** @param {Partial<ShellDeps>} [overrides] */
const setup = (overrides = {}) => {
    const deps = {
        registry: createRegistry(commands),
        fs: /** @type {any} */ ({ home: '/home/guest' }),
        session: { user: 'guest', host: 'gnikolaos.gr' },
        getCwd: () => '/home/guest',
        setCwd: vi.fn(),
        getHistory: () => [],
        navigate: vi.fn(),
        closeSession: vi.fn(),
        openUrl: vi.fn(),
        ...overrides,
    }
    return { deps, shell: createShell(deps), sink: createRecordingSink() }
}

describe('createShell', () => {
    test('does nothing for a blank line', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('   ', sink)).toEqual({ exitCode: 0 })
        expect(sink.events).toEqual([])
    })

    test('runs a single command with its argv', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('echo "a b" c', sink)).toEqual({ exitCode: 0 })
        expect(sink.events).toEqual([['stdout', 'a b c\n']])
    })

    test('passes null stdin to the first stage', async () => {
        const { shell, sink } = setup()
        await shell.run('stdin', sink)
        expect(sink.events).toEqual([['stdout', 'null']])
    })

    test('returns the command exit code', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('code 4', sink)).toEqual({ exitCode: 4 })
    })

    test('awaits async commands', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('async', sink)).toEqual({ exitCode: 3 })
        expect(sink.events).toEqual([['stdout', 'later\n']])
    })

    test('forwards markdown and clear to the sink', async () => {
        const { shell, sink } = setup()
        await shell.run('md hi', sink)
        await shell.run('wipe', sink)
        expect(sink.events).toEqual([['markdown', '# hi\n'], ['clear']])
    })

    test('reports parse errors with exit 2', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('echo "open', sink)).toEqual({ exitCode: 2 })
        expect(await shell.run('echo |', sink)).toEqual({ exitCode: 2 })
        expect(sink.events).toEqual([
            ['stderr', 'zsh: unmatched quote\n'],
            ['stderr', 'zsh: parse error near `|`\n'],
        ])
    })

    test('reports unknown commands with exit 127', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('nope x', sink)).toEqual({ exitCode: 127 })
        expect(sink.events).toEqual([['stderr', 'zsh: command not found: nope\n']])
    })

    test('runs no stage when any stage is unknown', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('echo hi | nope', sink)).toEqual({ exitCode: 127 })
        expect(sink.events).toEqual([['stderr', 'zsh: command not found: nope\n']])
    })

    test('reports a thrown error with exit 1', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('fail', sink)).toEqual({ exitCode: 1 })
        expect(sink.events).toEqual([['stderr', 'zsh: fail: it broke\n']])
    })

    test('builds ctx from live cwd, history and deps', async () => {
        let cwd = '/home/guest'
        /** @type {Ctx[]} */
        const seen = []
        const spy = defineFakeCommand('spy', {
            run: (ctx) => {
                seen.push(ctx)
            },
        })
        const { shell, sink, deps } = setup({
            registry: createRegistry([spy]),
            getCwd: () => cwd,
            getHistory: () => ['ls', 'pwd'],
        })
        await shell.run('spy', sink)
        cwd = '/home/guest/posts'
        await shell.run('spy', sink)

        expect(seen.map((ctx) => ctx.cwd)).toEqual(['/home/guest', '/home/guest/posts'])
        expect(seen[0]).toMatchObject({
            fs: deps.fs,
            home: '/home/guest',
            session: deps.session,
            history: ['ls', 'pwd'],
            registry: deps.registry,
            setCwd: deps.setCwd,
            navigate: deps.navigate,
            openUrl: deps.openUrl,
        })
        expect(seen[0].signal).toBeInstanceOf(AbortSignal)
    })

    test('reads cwd again for each pipeline stage', async () => {
        let cwd = '/a'
        const move = defineFakeCommand('move', {
            run: (ctx) => {
                ctx.setCwd('/b')
                ctx.stdout('moved')
            },
        })
        const where = defineFakeCommand('where', { run: (ctx) => ctx.stdout(ctx.cwd) })
        const { shell, sink } = setup({
            registry: createRegistry([move, where]),
            getCwd: () => cwd,
            setCwd: (path) => (cwd = path),
        })
        await shell.run('move | where', sink)
        expect(sink.events).toEqual([['stdout', '/b']])
    })
})

describe('createShell pipelines', () => {
    test('pipes stdout of one stage into the next', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('echo hi there | upper', sink)).toEqual({ exitCode: 0 })
        expect(sink.events).toEqual([['stdout', 'HI THERE\n']])
    })

    test('pipes through three stages', async () => {
        const { shell, sink } = setup()
        await shell.run('echo a | upper | stdin', sink)
        expect(sink.events).toEqual([['stdout', JSON.stringify('A\n')]])
    })

    test('buffers markdown into the next stdin', async () => {
        const { shell, sink } = setup()
        await shell.run('md title | stdin', sink)
        expect(sink.events).toEqual([['stdout', JSON.stringify('# title\n')]])
    })

    test('strips ansi styles from piped stdout but keeps them for the sink', async () => {
        const { shell, sink } = setup()
        await shell.run('colored | stdin', sink)
        await shell.run('colored', sink)
        expect(sink.events).toEqual([
            ['stdout', JSON.stringify('posts\n')],
            ['stdout', '\x1b[1;34mposts\x1b[0m\n'],
        ])
    })

    test('gives an empty string stdin when the previous stage printed nothing', async () => {
        const { shell, sink } = setup()
        await shell.run('code 0 | stdin', sink)
        expect(sink.events).toEqual([['stdout', '""']])
    })

    test('sends stderr of a middle stage straight to the sink', async () => {
        const { shell, sink } = setup()
        await shell.run('echo x | warn | upper', sink)
        expect(sink.events).toEqual([
            ['stderr', 'warn: careful\n'],
            ['stdout', 'WARNED X\n'],
        ])
    })

    test('does not clear the screen from a middle stage', async () => {
        const { shell, sink } = setup()
        await shell.run('wipe | stdin', sink)
        expect(sink.events).toEqual([['stdout', '""']])
    })

    test('exits with the last stage code', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('code 5 | code 0', sink)).toEqual({ exitCode: 0 })
        expect(await shell.run('code 0 | code 6', sink)).toEqual({ exitCode: 6 })
    })

    test('keeps running after a stage throws', async () => {
        const { shell, sink } = setup()
        expect(await shell.run('fail | stdin', sink)).toEqual({ exitCode: 0 })
        expect(sink.events).toEqual([
            ['stderr', 'zsh: fail: it broke\n'],
            ['stdout', '""'],
        ])
    })
})

describe('createShell abort', () => {
    test('resolves 130 once the running stage returns, without output', async () => {
        const gate = createDeferred()
        const started = createDeferred()
        let sawAbort = false
        const wait = defineFakeCommand('wait', {
            run: async (ctx) => {
                started.resolve()
                await gate.promise
                sawAbort = ctx.signal.aborted
                return 0
            },
        })
        const after = defineFakeCommand('after', { run: (ctx) => ctx.stdout('should not run') })
        const { shell, sink } = setup({ registry: createRegistry([wait, after]) })
        const controller = new AbortController()

        const result = shell.run('wait | after', sink, controller.signal)
        await started.promise
        controller.abort()
        gate.resolve()

        expect(await result).toEqual({ exitCode: 130 })
        expect(sawAbort).toBe(true)
        expect(sink.events).toEqual([])
    })

    test('stays silent when an aborted stage throws', async () => {
        const controller = new AbortController()
        const boom = defineFakeCommand('boom', {
            run: () => {
                controller.abort()
                throw new Error('aborted')
            },
        })
        const { shell, sink } = setup({ registry: createRegistry([boom]) })
        expect(await shell.run('boom', sink, controller.signal)).toEqual({ exitCode: 130 })
        expect(sink.events).toEqual([])
    })

    test('runs nothing when the signal is already aborted', async () => {
        const controller = new AbortController()
        controller.abort()
        const { shell, sink } = setup()
        expect(await shell.run('echo hi', sink, controller.signal)).toEqual({ exitCode: 130 })
        expect(sink.events).toEqual([])
    })
})
