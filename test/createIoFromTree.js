import { CONTENT_URL } from '@gnikolaos/terminal/fs/CONTENT_URL'
import { FsError } from '@gnikolaos/terminal/fs/FsError'
import { createFakeFile } from './createFakeFile'

/** @import { Entry, FsIo } from '@gnikolaos/terminal/fs/types' */
/** @import { FakeFile, FakeTree } from './types' */

/**
 * @param {FakeTree | FakeFile | string} node
 * @returns {FakeFile | null}
 */
const findFakeFile = (node) => {
    if (typeof node === 'string') return createFakeFile(node)
    return 'isFakeFile' in node ? /** @type {FakeFile} */ (node) : null
}

/**
 * @param {string} name
 * @param {FakeTree | FakeFile | string} node
 * @returns {Entry}
 */
const buildEntry = (name, node) => {
    const fakeFile = findFakeFile(node)
    if (!fakeFile) return { name, type: 'dir' }
    return {
        name,
        type: 'file',
        size: 'size' in fakeFile ? fakeFile.size : fakeFile.content.length,
        mtime: fakeFile.mtime,
    }
}

/**
 * @param {FakeTree} tree
 * @param {string} url
 * @returns {FakeTree | FakeFile | string | undefined}
 */
const findNodeAtUrl = (tree, url) => {
    /** @type {FakeTree | FakeFile | string | undefined} */
    let node = tree
    for (const part of url.slice(CONTENT_URL.length).split('/').filter(Boolean)) {
        if (node === undefined || findFakeFile(node) || !Object.hasOwn(node, part)) return undefined
        node = /** @type {FakeTree} */ (node)[part]
    }
    return node
}

/**
 * Builds an FsIo that serves manifests and files from an in-memory fake tree.
 * @param {FakeTree} tree
 * @returns {FsIo}
 */
const createIoFromTree = (tree) => ({
    loadManifest: async (dirUrl) => {
        const node = findNodeAtUrl(tree, dirUrl)
        if (node === undefined || findFakeFile(node)) throw new FsError('ENOENT', dirUrl)
        return Object.entries(node).map(([name, child]) => buildEntry(name, child))
    },
    loadFile: async (fileUrl) => {
        const node = findNodeAtUrl(tree, fileUrl)
        const fakeFile = node === undefined ? null : findFakeFile(node)
        if (!fakeFile) throw new FsError('ENOENT', fileUrl)
        if (fakeFile.failRead) throw new FsError('EIO', fileUrl)
        return fakeFile.content
    },
})

export { createIoFromTree }
