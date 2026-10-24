import { describe, expect, test } from 'vitest'
import { createVfs } from './vfs'
import { FsError } from './FsError'

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

/**
 * @param {Record<string, unknown>} dir
 * @returns {import('./vfs').Entry[]}
 */
const toEntries = (dir) =>
    Object.entries(dir).map(([name, value]) =>
        typeof value === 'string' ? { name, type: 'file', size: value.length } : { name, type: 'dir' },
    )

/**
 * @param {string} url
 * @returns {unknown}
 */
const lookup = (url) => {
    /** @type {unknown} */
    let node = tree
    for (const segment of url
        .replace(/^\/dirs/, '')
        .split('/')
        .filter(Boolean)) {
        node =
            typeof node === 'object' && node !== null
                ? /** @type {Record<string, unknown>} */ (node)[segment]
                : undefined
    }
    return node
}

const createFakeIo = () => {
    /** @type {string[]} */
    const manifestCalls = []
    /** @type {string[]} */
    const fileCalls = []
    /** @type {import('./vfs').FsIo} */
    const io = {
        loadManifest: async (dirUrl) => {
            manifestCalls.push(dirUrl)
            const node = lookup(dirUrl)
            if (typeof node !== 'object' || node === null) throw new FsError('ENOENT', dirUrl)
            return toEntries(/** @type {Record<string, unknown>} */ (node))
        },
        loadFile: async (fileUrl) => {
            fileCalls.push(fileUrl)
            const node = lookup(fileUrl)
            if (typeof node !== 'string') throw new FsError('ENOENT', fileUrl)
            return node
        },
    }
    return { io, manifestCalls, fileCalls }
}

const setup = () => {
    const fake = createFakeIo()
    return { ...fake, vfs: createVfs(fake.io) }
}

/**
 * @param {Promise<unknown>} promise
 * @param {string} code
 */
const expectFsError = async (promise, code) => {
    await expect(promise).rejects.toBeInstanceOf(FsError)
    await expect(promise).rejects.toMatchObject({ code })
}

describe('resolve', () => {
    const { vfs } = setup()
    const home = '/home/visitor'

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
        ['/home/visitor/posts/../../visitor', home],
    ])('from home: %s -> %s', (path, expected) => {
        expect(vfs.resolve(home, path)).toBe(expected)
    })

    test('empty path returns cwd', () => {
        expect(vfs.resolve('/home/visitor/posts', '')).toBe('/home/visitor/posts')
    })

    test('relative paths join on a nested cwd', () => {
        expect(vfs.resolve('/home/visitor/posts/drafts', 'draft.md')).toBe('/home/visitor/posts/drafts/draft.md')
        expect(vfs.resolve('/home/visitor/posts/drafts', '../../about-me/bio.md')).toBe('/home/visitor/about-me/bio.md')
        expect(vfs.resolve('/home/visitor/posts/drafts', '~/projects')).toBe('/home/visitor/projects')
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

describe('displayPath', () => {
    const { vfs } = setup()

    test.each([
        ['/home/visitor', '~'],
        ['/home/visitor/posts', '~/posts'],
        ['/home/visitor/posts/drafts', '~/posts/drafts'],
        ['/home', '/home'],
        ['/', '/'],
        ['/home/visitorx', '/home/visitorx'],
    ])('%s -> %s', (path, expected) => {
        expect(vfs.displayPath(path)).toBe(expected)
    })
})

describe('toUrl', () => {
    const { vfs } = setup()

    test.each([
        ['/home/visitor', '/dirs'],
        ['/home/visitor/posts', '/dirs/posts'],
        ['/home/visitor/posts/x.md', '/dirs/posts/x.md'],
        ['/home', null],
        ['/', null],
        ['/home/visitorx/a.md', null],
    ])('%s -> %s', (path, expected) => {
        expect(vfs.toUrl(path)).toBe(expected)
    })
})

describe('stat', () => {
    test('synthetic dirs need no io', async () => {
        const { vfs, manifestCalls } = setup()
        expect(await vfs.stat('/')).toEqual({ name: '/', type: 'dir' })
        expect(await vfs.stat('/home')).toEqual({ name: 'home', type: 'dir' })
        expect(await vfs.stat('/home/visitor')).toEqual({ name: 'visitor', type: 'dir' })
        expect(manifestCalls).toEqual([])
    })

    test('returns the manifest entry for files and dirs', async () => {
        const { vfs } = setup()
        expect(await vfs.stat('/home/visitor/posts')).toEqual({ name: 'posts', type: 'dir' })
        expect(await vfs.stat('/home/visitor/posts/post-1.md')).toEqual({ name: 'post-1.md', type: 'file', size: 8 })
    })

    test('missing paths throw ENOENT', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.stat('/home/visitor/nope'), 'ENOENT')
        await expectFsError(vfs.stat('/home/visitor/nope/deeper'), 'ENOENT')
        await expectFsError(vfs.stat('/etc'), 'ENOENT')
        await expectFsError(vfs.stat('/home/other'), 'ENOENT')
    })

    test('a file in the middle of a path throws ENOTDIR', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.stat('/home/visitor/posts/post-1.md/x'), 'ENOTDIR')
    })
})

describe('readdir', () => {
    test('synthetic dirs list their single child', async () => {
        const { vfs, manifestCalls } = setup()
        expect(await vfs.readdir('/')).toEqual([{ name: 'home', type: 'dir' }])
        expect(await vfs.readdir('/home')).toEqual([{ name: 'visitor', type: 'dir' }])
        expect(manifestCalls).toEqual([])
    })

    test('home loads the root manifest', async () => {
        const { vfs, manifestCalls } = setup()
        const entries = await vfs.readdir('/home/visitor')
        expect(entries.map((entry) => entry.name)).toEqual(['about-me', 'posts', 'projects'])
        expect(manifestCalls).toEqual(['/dirs'])
    })

    test('loads every directory along the path once', async () => {
        const { vfs, manifestCalls } = setup()
        const entries = await vfs.readdir('/home/visitor/posts/drafts')
        expect(entries).toEqual([{ name: 'draft.md', type: 'file', size: 7 }])
        await vfs.readdir('/home/visitor/posts/drafts')
        await vfs.readdir('/home/visitor/posts')
        await vfs.stat('/home/visitor/posts/post-1.md')
        expect(manifestCalls).toEqual(['/dirs', '/dirs/posts', '/dirs/posts/drafts'])
    })

    test('concurrent calls share one load per directory', async () => {
        const { vfs, manifestCalls } = setup()
        await Promise.all([
            vfs.readdir('/home/visitor/posts'),
            vfs.readdir('/home/visitor/posts'),
            vfs.readdir('/home/visitor/about-me'),
            vfs.stat('/home/visitor/posts/post-1.md'),
        ])
        expect([...manifestCalls].sort()).toEqual(['/dirs', '/dirs/about-me', '/dirs/posts'])
    })

    test('empty directories return an empty list', async () => {
        const { vfs } = setup()
        expect(await vfs.readdir('/home/visitor/projects')).toEqual([])
    })

    test('missing dir throws ENOENT', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.readdir('/home/visitor/nope'), 'ENOENT')
        await expectFsError(vfs.readdir('/var'), 'ENOENT')
    })

    test('a file throws ENOTDIR', async () => {
        const { vfs } = setup()
        await expectFsError(vfs.readdir('/home/visitor/posts/post-1.md'), 'ENOTDIR')
        await expectFsError(vfs.readdir('/home/visitor/posts/post-1.md/x'), 'ENOTDIR')
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
        await expectFsError(vfs.readdir('/home/visitor'), 'EIO')
        expect(await vfs.readdir('/home/visitor')).toHaveLength(3)
        expect(manifestCalls).toEqual(['/dirs'])
    })
})

describe('readFile', () => {
    test('loads content from the mapped url', async () => {
        const { vfs, fileCalls } = setup()
        expect(await vfs.readFile('/home/visitor/about-me/bio.md')).toBe('# About me')
        expect(fileCalls).toEqual(['/dirs/about-me/bio.md'])
    })

    test('caches content after the first load', async () => {
        const { vfs, fileCalls } = setup()
        await Promise.all([vfs.readFile('/home/visitor/about-me/cv.md'), vfs.readFile('/home/visitor/about-me/cv.md')])
        await vfs.readFile('/home/visitor/about-me/cv.md')
        expect(fileCalls).toEqual(['/dirs/about-me/cv.md'])
    })

    test('a directory throws EISDIR', async () => {
        const { vfs, fileCalls } = setup()
        await expectFsError(vfs.readFile('/home/visitor/posts'), 'EISDIR')
        await expectFsError(vfs.readFile('/home/visitor'), 'EISDIR')
        await expectFsError(vfs.readFile('/'), 'EISDIR')
        expect(fileCalls).toEqual([])
    })

    test('a missing file throws ENOENT without fetching', async () => {
        const { vfs, fileCalls } = setup()
        await expectFsError(vfs.readFile('/home/visitor/posts/nope.md'), 'ENOENT')
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
        await expectFsError(vfs.readFile('/home/visitor/posts/post-1.md'), 'EIO')
    })

    test('FsErrors from io pass through', async () => {
        const { io } = createFakeIo()
        const vfs = createVfs({
            ...io,
            loadFile: async (url) => {
                throw new FsError('ENOENT', url)
            },
        })
        await expectFsError(vfs.readFile('/home/visitor/posts/post-1.md'), 'ENOENT')
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
