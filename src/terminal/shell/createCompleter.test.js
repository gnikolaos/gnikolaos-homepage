import { describe, expect, test } from 'vitest'
import { FsError } from '../fs/FsError'
import { createVfs } from '../fs/createVfs'
import { HOME } from '@test/HOME'
import { createIoFromTree } from '@test/createIoFromTree'
import { defineFakeCommand } from '@test/defineFakeCommand'
import { createCompleter } from './createCompleter'
import { createRegistry } from './createRegistry'

/** @import { FsIo } from '../fs/types' */

const tree = {
    '.secret': 'hidden',
    '.config': {},
    'about-me': { 'bio.md': '# Bio', 'cv.md': '# CV' },
    posts: { 'post-1.md': '# 1', 'post-2.md': '# 2', 'my post.md': '# mine', drafts: { 'draft.md': '# d' } },
    projects: {},
    'readme.md': '# Readme',
}

const registry = createRegistry([
    defineFakeCommand('cat'),
    defineFakeCommand('cd', { complete: 'dirs' }),
    defineFakeCommand('clear', { complete: 'none' }),
    defineFakeCommand('man', { complete: 'commands' }),
    defineFakeCommand('secret', { hidden: true }),
])

/**
 * @param {{ cwd?: string, io?: FsIo }} [options]
 */
const setup = ({ cwd = HOME, io = createIoFromTree(tree) } = {}) =>
    createCompleter({ fs: createVfs(io, { home: HOME }), registry, getCwd: () => cwd })

/**
 * @param {string} line   the cursor is at '^' when present, else at the end
 * @param {Parameters<typeof setup>[0]} [options]
 */
const complete = (line, options) => {
    const cursor = line.includes('^') ? line.indexOf('^') : line.length
    return setup(options)(line.replace('^', ''), cursor)
}

/**
 * @param {string} line
 * @param {Parameters<typeof setup>[0]} [options]
 */
const candidates = async (line, options) => (await complete(line, options)).candidates

describe('createCompleter', () => {
    test('completes command names on an empty line, hidden ones included', async () => {
        expect(await complete('')).toEqual({
            start: 0,
            end: 0,
            candidates: ['cat', 'cd', 'clear', 'man', 'secret'],
        })
    })

    test('completes command names by prefix', async () => {
        expect(await candidates('c')).toEqual(['cat', 'cd', 'clear'])
        expect(await candidates('cl')).toEqual(['clear'])
        expect(await candidates('zz')).toEqual([])
    })

    test('completes the command name of a stage after a pipe', async () => {
        expect(await complete('cat x | m')).toEqual({ start: 8, end: 9, candidates: ['man'] })
    })

    test('replaces the whole word when the cursor is in the middle', async () => {
        expect(await complete('cat po^sts')).toEqual({ start: 4, end: 9, candidates: ['posts/'] })
    })

    test('completes paths relative to the cwd for path commands', async () => {
        expect(await candidates('cat ')).toEqual(['about-me/', 'posts/', 'projects/', 'readme.md'])
        expect(await candidates('cat p')).toEqual(['posts/', 'projects/'])
        expect(await candidates('cat posts/p')).toEqual(['posts/post-1.md', 'posts/post-2.md'])
    })

    test('offers hidden entries only for a dot prefix', async () => {
        expect(await candidates('cat .')).toEqual(['.config/', '.secret'])
        expect(await candidates('cat .s')).toEqual(['.secret'])
    })

    test('offers only directories for dirs commands', async () => {
        expect(await candidates('cd ')).toEqual(['about-me/', 'posts/', 'projects/'])
        expect(await candidates('cd posts/')).toEqual(['posts/drafts/'])
    })

    test('completes command names for commands kind', async () => {
        expect(await candidates('man c')).toEqual(['cat', 'cd', 'clear'])
    })

    test('yields nothing for none kind and unknown commands', async () => {
        expect(await complete('clear p')).toEqual({ start: 6, end: 7, candidates: [] })
        expect(await candidates('nope p')).toEqual([])
    })

    test('expands home, root and parent directories through resolve', async () => {
        expect(await candidates('cat ~/pos', { cwd: '/' })).toEqual(['~/posts/'])
        expect(await candidates('cat ../ab', { cwd: `${HOME}/posts` })).toEqual(['../about-me/'])
        expect(await candidates('cd /')).toEqual(['/home/'])
        expect(await candidates('cd /home/')).toEqual(['/home/guest/'])
        expect(await candidates('cat ./r')).toEqual(['./readme.md'])
        expect(await complete('cd ~')).toEqual({ start: 3, end: 4, candidates: ['~/'] })
        expect(await candidates('cat ~')).toEqual(['~/'])
    })

    test('matches quoted and escaped words unescaped', async () => {
        expect(await candidates('cat "posts/my')).toEqual(['posts/my post.md'])
        expect(await candidates("cat 'posts/my p'")).toEqual(['posts/my post.md'])
        expect(await candidates('cat posts/my\\ ')).toEqual(['posts/my post.md'])
    })

    test('yields nothing for missing directories and files used as directories', async () => {
        expect(await candidates('cat nope/')).toEqual([])
        expect(await candidates('cat readme.md/')).toEqual([])
    })

    test('yields nothing when a manifest fails to load', async () => {
        const io = {
            ...createIoFromTree(tree),
            loadManifest: async (/** @type {string} */ url) => {
                throw new FsError('EIO', url)
            },
        }
        expect(await candidates('cat ', { io })).toEqual([])
    })

    test('rethrows errors that are not fs errors', async () => {
        const fs = {
            ...createVfs(createIoFromTree(tree), { home: HOME }),
            readdir: async () => {
                throw new TypeError('boom')
            },
        }
        const completer = createCompleter({ fs, registry, getCwd: () => HOME })
        await expect(completer('cat ', 4)).rejects.toThrow('boom')
    })

    test('loads directories lazily and shares concurrent loads', async () => {
        const base = createIoFromTree(tree)
        /** @type {string[]} */
        const loaded = []
        const io = {
            ...base,
            loadManifest: async (/** @type {string} */ url) => {
                loaded.push(url)
                return base.loadManifest(url)
            },
        }
        const completer = setup({ io })
        expect(loaded).toEqual([])
        const results = await Promise.all([
            completer('cat posts/drafts/', 17),
            completer('cd posts/', 9),
            completer('cat posts/drafts/d', 18),
        ])
        expect(results.map((result) => result.candidates)).toEqual([
            ['posts/drafts/draft.md'],
            ['posts/drafts/'],
            ['posts/drafts/draft.md'],
        ])
        expect([...loaded].sort()).toEqual(['/dirs', '/dirs/posts', '/dirs/posts/drafts'])
    })
})
