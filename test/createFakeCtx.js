import { createVfs } from '@gnikolaos/terminal/fs/createVfs'
import { createRegistry } from '@gnikolaos/terminal/shell/createRegistry'
import { HOME } from './HOME'
import { createIoFromTree } from './createIoFromTree'

/** @import { Command, Ctx } from '@gnikolaos/terminal/shell/types' */
/** @import { FakeTree } from './types' */

/**
 * Creates a command ctx over a fake tree that records everything the command outputs.
 * @param {{ tree?: FakeTree, cwd?: string, history?: string[], commands?: Command[], signal?: AbortSignal }} [options]
 */
const createFakeCtx = ({ tree = {}, cwd = HOME, history = [], commands = [], signal } = {}) => {
    const recorded = {
        stdout: [],
        stderr: [],
        markdown: [],
        clears: 0,
        navigations: [],
        sessionCloses: 0,
        opened: [],
        cwdChanges: [],
    }
    const ctx = /** @type {Ctx} */ ({
        fs: createVfs(createIoFromTree(tree), { home: HOME }),
        cwd,
        setCwd: (absPath) => {
            recorded.cwdChanges.push(absPath)
            ctx.cwd = absPath
        },
        home: HOME,
        session: { user: 'guest', host: 'gnikolaos.gr' },
        history,
        registry: createRegistry(commands),
        navigate: (path) => recorded.navigations.push(path),
        closeSession: () => {
            recorded.sessionCloses += 1
        },
        openUrl: (url) => recorded.opened.push(url),
        signal: signal ?? new AbortController().signal,
        stdout: (text) => recorded.stdout.push(text),
        stderr: (text) => recorded.stderr.push(text),
        markdown: (content) => recorded.markdown.push(content),
        clear: () => {
            recorded.clears += 1
        },
    })
    return { ctx, recorded, stdoutText: () => recorded.stdout.join(''), stderrText: () => recorded.stderr.join('') }
}

export { createFakeCtx }
