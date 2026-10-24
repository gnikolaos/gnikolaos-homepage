import { describe, expect, test, vi } from 'vitest'
import { createRegistry, defineCommand } from './registry.js'
import { createShell } from './shell.js'

/** @typedef {import('./registry.js').Ctx} Ctx */
/** @typedef {import('./registry.js').Command['run']} Run */

/**
 * @param {string} name
 * @param {Run} run
 */
const fake = (name, run) => defineCommand({ name, summary: name, usage: name, run })

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
    fake('echo', (ctx, argv) => ctx.stdout(argv.join(' ') + '\n')),
    fake('upper', (ctx, _argv, stdin) => ctx.stdout((stdin ?? '').toUpperCase())),
    fake('md', (ctx, argv) => ctx.markdown(`# ${argv.join(' ')}\n`)),
    fake('stdin', (ctx, _argv, stdin) => ctx.stdout(JSON.stringify(stdin))),
    fake('warn', (ctx, _argv, stdin) => {
        ctx.stderr('warn: careful\n')
        ctx.stdout(`warned ${stdin ?? ''}`)
    }),
    fake('code', (_ctx, argv) => Number(argv[0])),
    fake('fail', () => {
        throw new Error('it broke')
    }),
    fake('wipe', (ctx) => ctx.clear()),
    fake('async', async (ctx) => {
        await Promise.resolve()
        ctx.stdout('later\n')
        return 3
    }),
]

/** @param {Partial<import('./shell.js').ShellDeps>} [overrides] */
const setup = (overrides = {}) => {
    const deps = {
        registry: createRegistry(commands),
        fs: /** @type {any} */ ({ home: '/home/visitor' }),
        session: { user: 'visitor', host: 'gnikolaos.gr' },
        getCwd: () => '/home/visitor',
        setCwd: vi.fn(),
        getHistory: () => [],
        navigate: vi.fn(),
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
        let cwd = '/home/visitor'
        /** @type {Ctx[]} */
        const seen = []
        const spy = fake('spy', (ctx) => {
            seen.push(ctx)
        })
        const { shell, sink, deps } = setup({
            registry: createRegistry([spy]),
            getCwd: () => cwd,
            getHistory: () => ['ls', 'pwd'],
        })
        await shell.run('spy', sink)
        cwd = '/home/visitor/posts'
        await shell.run('spy', sink)

        expect(seen.map((ctx) => ctx.cwd)).toEqual(['/home/visitor', '/home/visitor/posts'])
        expect(seen[0]).toMatchObject({
            fs: deps.fs,
            home: '/home/visitor',
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
        const move = fake('move', (ctx) => {
            ctx.setCwd('/b')
            ctx.stdout('moved')
        })
        const where = fake('where', (ctx) => ctx.stdout(ctx.cwd))
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
        const wait = fake('wait', async (ctx) => {
            started.resolve()
            await gate.promise
            sawAbort = ctx.signal.aborted
            return 0
        })
        const after = fake('after', (ctx) => ctx.stdout('should not run'))
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
        const boom = fake('boom', () => {
            controller.abort()
            throw new Error('aborted')
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
