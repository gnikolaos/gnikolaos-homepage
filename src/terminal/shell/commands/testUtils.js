import { FsError } from '../../fs/FsError'
import { createVfs } from '../../fs/vfs'
import { createRegistry } from '../registry'

/** @typedef {import('../registry').Ctx} Ctx */
/** @typedef {import('../registry').Command} Command */
/** @typedef {import('../../fs/vfs').Entry} Entry */
/** @typedef {import('../../fs/vfs').FsIo} FsIo */

/**
 * @typedef {object} FakeFile
 * @property {true} isFakeFile
 * @property {string} content
 * @property {number} [size]
 * @property {string} [mtime]
 * @property {boolean} [failRead]
 */

/** @typedef {{ [name: string]: FakeTree | FakeFile | string }} FakeTree */

const HOME = '/home/visitor'
const CONTENT_URL = '/dirs'

/**
 * @param {string} content
 * @param {{ size?: number, mtime?: string, failRead?: boolean }} [meta]
 * @returns {FakeFile}
 */
const file = (content, meta = {}) => ({ isFakeFile: true, content, ...meta })

/**
 * @param {FakeTree | FakeFile | string} node
 * @returns {FakeFile | null}
 */
const asFile = (node) => {
    if (typeof node === 'string') return file(node)
    return 'isFakeFile' in node ? /** @type {FakeFile} */ (node) : null
}

/**
 * @param {string} name
 * @param {FakeTree | FakeFile | string} node
 * @returns {Entry}
 */
const toEntry = (name, node) => {
    const leaf = asFile(node)
    if (!leaf) return { name, type: 'dir' }
    return { name, type: 'file', size: leaf.size ?? leaf.content.length, mtime: leaf.mtime }
}

/**
 * @param {FakeTree} tree
 * @param {string} url
 * @returns {FakeTree | FakeFile | string | undefined}
 */
const nodeAtUrl = (tree, url) => {
    /** @type {FakeTree | FakeFile | string | undefined} */
    let node = tree
    for (const part of url.slice(CONTENT_URL.length).split('/').filter(Boolean)) {
        if (node === undefined || asFile(node) || !Object.hasOwn(node, part)) return undefined
        node = /** @type {FakeTree} */ (node)[part]
    }
    return node
}

/**
 * @param {FakeTree} tree
 * @returns {FsIo}
 */
const ioFromTree = (tree) => ({
    loadManifest: async (dirUrl) => {
        const node = nodeAtUrl(tree, dirUrl)
        if (node === undefined || asFile(node)) throw new FsError('ENOENT', dirUrl)
        return Object.entries(node).map(([name, child]) => toEntry(name, child))
    },
    loadFile: async (fileUrl) => {
        const node = nodeAtUrl(tree, fileUrl)
        const leaf = node === undefined ? null : asFile(node)
        if (!leaf) throw new FsError('ENOENT', fileUrl)
        if (leaf.failRead) throw new FsError('EIO', fileUrl)
        return leaf.content
    },
})

/**
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
        fs: createVfs(ioFromTree(tree), { home: HOME }),
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

/**
 * @param {Command} command
 * @param {string[]} argv
 * @param {Parameters<typeof createFakeCtx>[0] & { stdin?: string | null }} [options]
 */
const runCommand = async (command, argv, { stdin = null, ...options } = {}) => {
    const fake = createFakeCtx(options)
    const result = await command.run(fake.ctx, argv, stdin)
    return { ...fake, exitCode: result ?? 0 }
}

export { HOME, file, ioFromTree, createFakeCtx, runCommand }
