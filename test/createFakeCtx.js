import { createVfs } from '@gnikolaos/terminal/fs/createVfs'
import { createRegistry } from '@gnikolaos/terminal/shell/registry'
import { HOME } from './HOME'
import { createIoFromTree } from './createIoFromTree'

/** @typedef {import('@gnikolaos/terminal/shell/registry').Ctx} Ctx */
/** @typedef {import('@gnikolaos/terminal/shell/registry').Command} Command */
/** @typedef {import('./createIoFromTree').FakeTree} FakeTree */

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
        session: { user: 'visitor', host: 'gnikolaos.gr' },
        history,
        registry: createRegistry(commands),
        navigate: (path) => recorded.navigations.push(path),
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
