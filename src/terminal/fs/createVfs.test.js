import { describe, expect, test } from 'vitest'
import { createIoFromTree } from '@test/createIoFromTree'
import { expectFsError } from '@test/expectFsError'
import { createVfs } from './createVfs'
import { FsError } from './FsError'

/** @import { FsIo } from './types' */

const tree = {
    'about-me': {
        'bio.md': '# About me',
        'cv.md': '# CV',
    },
    posts: {
        'post-1.md': '# Post 1',
        drafts: {
            'draft.md': '# Draft',
        },
    },
    projects: {},
}

const createFakeIo = () => {
    const base = createIoFromTree(tree)
    /** @type {string[]} */
    const manifestCalls = []
    /** @type {string[]} */
    const fileCalls = []
    /** @type {FsIo} */
    const io = {
        loadManifest: async (dirUrl) => {
            manifestCalls.push(dirUrl)
            return base.loadManifest(dirUrl)
        },
        loadFile: async (fileUrl) => {
            fileCalls.push(fileUrl)
            return base.loadFile(fileUrl)
        },
    }
    return { io, manifestCalls, fileCalls }
}

const setup = () => {
    const fake = createFakeIo()
    return { ...fake, vfs: createVfs(fake.io) }
}

describe('resolve', () => {
    const { vfs } = setup()
    const home = '/home/guest'

    test.each([
        ['~', home],
        ['~/', home],
        ['~/posts', `${home}/posts`],
        ['~/posts/../about-me', `${home}/about-me`],
        ['/', '/'],
        ['.', home],
        ['..', '/home'],
        ['../..', '/'],
        ['../../../..', '/'],
        ['/..', '/'],
        ['posts/', `${home}/posts`],
        ['posts//drafts///', `${home}/posts/drafts`],
        ['//etc//', '/etc'],
        ['./posts/./drafts', `${home}/posts/drafts`],
        ['/home/guest/posts/../../guest', home],
    ])('from home: %s -> %s', (path, expected) => {
        expect(vfs.resolve(home, path)).toBe(expected)
    })

    test('empty path returns cwd', () => {
        expect(vfs.resolve('/home/guest/posts', '')).toBe('/home/guest/posts')
    })

    test('relative paths join on a nested cwd', () => {
        expect(vfs.resolve('/home/guest/posts/drafts', 'draft.md')).toBe('/home/guest/posts/drafts/draft.md')
        expect(vfs.resolve('/home/guest/posts/drafts', '../../about-me/bio.md')).toBe('/home/guest/about-me/bio.md')
        expect(vfs.resolve('/home/guest/posts/drafts', '~/projects')).toBe('/home/guest/projects')
    })

    test('relative paths from root', () => {
        expect(vfs.resolve('/', 'home')).toBe('/home')
        expect(vfs.resolve('/', '..')).toBe('/')
    })

    test('a tilde not at the start is a plain segment', () => {
        expect(vfs.resolve('/', 'a/~')).toBe('/a/~')
        expect(vfs.resolve('/', '~x')).toBe('/~x')
    })
})

describe('formatDisplayPath', () => {
    const { vfs } = setup()

    test.each([
        ['/home/guest', '~'],
        ['/home/guest/posts', '~/posts'],
        ['/home/guest/posts/drafts', '~/posts/drafts'],
        ['/home', '/home'],
        ['/', '/'],
        ['/home/guestx', '/home/guestx'],
    ])('%s -> %s', (path, expected) => {
        expect(vfs.formatDisplayPath(path)).toBe(expected)
    })
})

describe('findContentUrl', () => {
    const { vfs } = setup()

    test.each([
        ['/home/guest', '/dirs'],
        ['/home/guest/posts', '/dirs/posts'],
        ['/home/guest/posts/x.md', '/dirs/posts/x.md'],
        ['/home', null],
        ['/', null],
        ['/home/guestx/a.md', null],
    ])('%s -> %s', (path, expected) => {
        expect(vfs.findContentUrl(path)).toBe(expected)
    })
})

describe('stat', () => {
    test('synthetic dirs need no io', async () => {
        const { vfs, manifestCalls } = setup()
        expect(await vfs.stat('/')).toEqual({ name: '/', type: 'dir' })
        expect(await vfs.stat('/home')).toEqual({ name: 'home', type: 'dir' })
        expect(await vfs.stat('/home/guest')).toEqual({ name: 'guest', type: 'dir' })
        expect(manifestCalls).toEqual([])
    })

    test('returns the manifest entry for files and dirs', async () => {
        const { vfs } = setup()
        expect(await vfs.stat('/home/guest/posts')).toEqual({ name: 'posts', type: 'dir' })
        expect(await vfs.stat('/home/guest/posts/post-1.md')).toEqual({ name: 'post-1.md', type: 'file', size: 8 })
    })

    test('missing paths throw ENOENT', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.stat('/home/guest/nope'), 'ENOENT')
        await expectFsError(vfs.stat('/home/guest/nope/deeper'), 'ENOENT')
        await expectFsError(vfs.stat('/etc'), 'ENOENT')
        await expectFsError(vfs.stat('/home/other'), 'ENOENT')
    })

    test('a file in the middle of a path throws ENOTDIR', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.stat('/home/guest/posts/post-1.md/x'), 'ENOTDIR')
    })
})

describe('readdir', () => {
    test('synthetic dirs list their single child', async () => {
        const { vfs, manifestCalls } = setup()
        expect(await vfs.readdir('/')).toEqual([{ name: 'home', type: 'dir' }])
        expect(await vfs.readdir('/home')).toEqual([{ name: 'guest', type: 'dir' }])
        expect(manifestCalls).toEqual([])
    })

    test('home loads the root manifest', async () => {
        const { vfs, manifestCalls } = setup()
        const entries = await vfs.readdir('/home/guest')
        expect(entries.map((entry) => entry.name)).toEqual(['about-me', 'posts', 'projects'])
        expect(manifestCalls).toEqual(['/dirs'])
    })

    test('loads every directory along the path once', async () => {
        const { vfs, manifestCalls } = setup()
        const entries = await vfs.readdir('/home/guest/posts/drafts')
        expect(entries).toEqual([{ name: 'draft.md', type: 'file', size: 7 }])
        await vfs.readdir('/home/guest/posts/drafts')
        await vfs.readdir('/home/guest/posts')
        await vfs.stat('/home/guest/posts/post-1.md')
        expect(manifestCalls).toEqual(['/dirs', '/dirs/posts', '/dirs/posts/drafts'])
    })

    test('concurrent calls share one load per directory', async () => {
        const { vfs, manifestCalls } = setup()
        await Promise.all([
            vfs.readdir('/home/guest/posts'),
            vfs.readdir('/home/guest/posts'),
            vfs.readdir('/home/guest/about-me'),
            vfs.stat('/home/guest/posts/post-1.md'),
        ])
        expect([...manifestCalls].sort()).toEqual(['/dirs', '/dirs/about-me', '/dirs/posts'])
    })

    test('empty directories return an empty list', async () => {
        const { vfs } = setup()
        expect(await vfs.readdir('/home/guest/projects')).toEqual([])
    })

    test('missing dir throws ENOENT', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.readdir('/home/guest/nope'), 'ENOENT')
        await expectFsError(vfs.readdir('/var'), 'ENOENT')
    })

    test('a file throws ENOTDIR', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.readdir('/home/guest/posts/post-1.md'), 'ENOTDIR')
        await expectFsError(vfs.readdir('/home/guest/posts/post-1.md/x'), 'ENOTDIR')
    })

    test('a failed load is retried on the next call', async () => {
        const { io, manifestCalls } = createFakeIo()
        let failures = 1
        const vfs = createVfs({
            ...io,
            loadManifest: async (dirUrl) => {
                if (failures-- > 0) throw new Error('network down')
                return io.loadManifest(dirUrl)
            },
        })
        await expectFsError(vfs.readdir('/home/guest'), 'EIO')
        expect(await vfs.readdir('/home/guest')).toHaveLength(3)
        expect(manifestCalls).toEqual(['/dirs'])
    })
})

describe('readFile', () => {
    test('loads content from the mapped url', async () => {
        const { vfs, fileCalls } = setup()
        expect(await vfs.readFile('/home/guest/about-me/bio.md')).toBe('# About me')
        expect(fileCalls).toEqual(['/dirs/about-me/bio.md'])
    })

    test('caches content after the first load', async () => {
        const { vfs, fileCalls } = setup()
        await Promise.all([vfs.readFile('/home/guest/about-me/cv.md'), vfs.readFile('/home/guest/about-me/cv.md')])
        await vfs.readFile('/home/guest/about-me/cv.md')
        expect(fileCalls).toEqual(['/dirs/about-me/cv.md'])
    })

    test('a directory throws EISDIR', async () => {
        const { vfs, fileCalls } = setup()
        await expectFsError(vfs.readFile('/home/guest/posts'), 'EISDIR')
        await expectFsError(vfs.readFile('/home/guest'), 'EISDIR')
        await expectFsError(vfs.readFile('/'), 'EISDIR')
        expect(fileCalls).toEqual([])
    })

    test('a missing file throws ENOENT without fetching', async () => {
        const { vfs, fileCalls } = setup()
        await expectFsError(vfs.readFile('/home/guest/posts/nope.md'), 'ENOENT')
        await expectFsError(vfs.readFile('/etc/passwd'), 'ENOENT')
        expect(fileCalls).toEqual([])
    })

    test('io failures surface as EIO', async () => {
        const { io } = createFakeIo()
        const vfs = createVfs({
            ...io,
            loadFile: async () => {
                throw new TypeError('Failed to fetch')
            },
        })
        await expectFsError(vfs.readFile('/home/guest/posts/post-1.md'), 'EIO')
    })

    test('FsErrors from io pass through', async () => {
        const { io } = createFakeIo()
        const vfs = createVfs({
            ...io,
            loadFile: async (url) => {
                throw new FsError('ENOENT', url)
            },
        })
        await expectFsError(vfs.readFile('/home/guest/posts/post-1.md'), 'ENOENT')
    })
})

describe('createVfs', () => {
    test('exposes home and accepts a custom one', async () => {
        const { io, manifestCalls } = createFakeIo()
        const vfs = createVfs(io, { home: '/users/guest' })
        expect(vfs.home).toBe('/users/guest')
        expect(vfs.resolve('/', '~/posts')).toBe('/users/guest/posts')
        expect(await vfs.readdir('/users')).toEqual([{ name: 'guest', type: 'dir' }])
        await vfs.readdir('/users/guest/posts')
        expect(manifestCalls).toEqual(['/dirs', '/dirs/posts'])
    })
})
