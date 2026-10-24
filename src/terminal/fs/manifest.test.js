import { describe, expect, test } from 'vitest'
import { browserIo, fetchFile, fetchManifest } from './manifest'
import { FsError } from './FsError'

/**
 * @param {() => Promise<Response> | Response} respond
 */
const fakeFetch = (respond) => {
    /** @type {string[]} */
    const calls = []
    /** @type {typeof globalThis.fetch} */
    const fetchImpl = async (input) => {
        calls.push(String(input))
        return respond()
    }
    return { fetchImpl, calls }
}

/**
 * @param {Promise<unknown>} promise
 * @param {string} code
 * @param {string} path
 */
const expectFsError = async (promise, code, path) => {
    await expect(promise).rejects.toBeInstanceOf(FsError)
    await expect(promise).rejects.toMatchObject({ code, path })
}

const entries = [
    { name: 'posts', type: 'dir' },
    { name: 'bio.md', type: 'file', size: 10, mtime: '2026-10-24T12:00:00.000Z', title: 'About me' },
]

describe('fetchManifest', () => {
    test('fetches the manifest next to the dir url and returns its entries', async () => {
        const { fetchImpl, calls } = fakeFetch(() => Response.json({ entries }))
        expect(await fetchManifest('/dirs/about-me', fetchImpl)).toEqual(entries)
        expect(calls).toEqual(['/dirs/about-me/_manifest.json'])
    })

    test('works for the content root', async () => {
        const { fetchImpl, calls } = fakeFetch(() => Response.json({ entries: [] }))
        expect(await fetchManifest('/dirs', fetchImpl)).toEqual([])
        expect(calls).toEqual(['/dirs/_manifest.json'])
    })

    test('ignores the content type header', async () => {
        const body = JSON.stringify({ entries })
        const { fetchImpl } = fakeFetch(() => new Response(body, { headers: { 'Content-Type': 'text/html' } }))
        expect(await fetchManifest('/dirs', fetchImpl)).toEqual(entries)
    })

    test('non ok response throws ENOENT', async () => {
        const { fetchImpl } = fakeFetch(() => new Response('', { status: 404 }))
        await expectFsError(fetchManifest('/dirs/nope', fetchImpl), 'ENOENT', '/dirs/nope')
    })

    test('network failure throws EIO', async () => {
        const { fetchImpl } = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')))
        await expectFsError(fetchManifest('/dirs', fetchImpl), 'EIO', '/dirs')
    })

    test('invalid json throws EIO', async () => {
        const { fetchImpl } = fakeFetch(() => new Response('<!doctype html>'))
        await expectFsError(fetchManifest('/dirs', fetchImpl), 'EIO', '/dirs')
    })

    test.each([
        ['null', null],
        ['array', []],
        ['missing entries', {}],
        ['entries not an array', { entries: {} }],
        ['entry without name', { entries: [{ type: 'dir' }] }],
        ['entry with empty name', { entries: [{ name: '', type: 'dir' }] }],
        ['entry with bad type', { entries: [{ name: 'x', type: 'link' }] }],
        ['entry with bad size', { entries: [{ name: 'x.md', type: 'file', size: '1' }] }],
        ['entry with bad mtime', { entries: [{ name: 'x.md', type: 'file', mtime: 1 }] }],
        ['entry with bad title', { entries: [{ name: 'x.md', type: 'file', title: false }] }],
    ])('invalid shape (%s) throws EIO', async (_label, body) => {
        const { fetchImpl } = fakeFetch(() => Response.json(body))
        await expectFsError(fetchManifest('/dirs', fetchImpl), 'EIO', '/dirs')
    })

    test('urls outside /dirs throw ENOENT without fetching', async () => {
        const { fetchImpl, calls } = fakeFetch(() => Response.json({ entries }))
        await expectFsError(fetchManifest('/etc', fetchImpl), 'ENOENT', '/etc')
        await expectFsError(fetchManifest('/dirsx', fetchImpl), 'ENOENT', '/dirsx')
        expect(calls).toEqual([])
    })
})

describe('fetchFile', () => {
    test('returns the response text', async () => {
        const { fetchImpl, calls } = fakeFetch(() => new Response('# Hello'))
        expect(await fetchFile('/dirs/posts/post-1.md', fetchImpl)).toBe('# Hello')
        expect(calls).toEqual(['/dirs/posts/post-1.md'])
    })

    test('404 throws ENOENT', async () => {
        const { fetchImpl } = fakeFetch(() => new Response('', { status: 404 }))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'ENOENT', '/dirs/x.md')
    })

    test('other failures throw EIO', async () => {
        const { fetchImpl } = fakeFetch(() => new Response('', { status: 500 }))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'EIO', '/dirs/x.md')
    })

    test('network failure throws EIO', async () => {
        const { fetchImpl } = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'EIO', '/dirs/x.md')
    })

    test('non markdown or non content urls throw ENOENT without fetching', async () => {
        const { fetchImpl, calls } = fakeFetch(() => new Response('x'))
        await expectFsError(fetchFile('/dirs/x.txt', fetchImpl), 'ENOENT', '/dirs/x.txt')
        await expectFsError(fetchFile('/secret.md', fetchImpl), 'ENOENT', '/secret.md')
        expect(calls).toEqual([])
    })
})

describe('browserIo', () => {
    test('uses globalThis.fetch', async () => {
        const original = globalThis.fetch
        const { fetchImpl, calls } = fakeFetch(() => Response.json({ entries }))
        globalThis.fetch = fetchImpl
        try {
            expect(await browserIo.loadManifest('/dirs')).toEqual(entries)
            expect(calls).toEqual(['/dirs/_manifest.json'])
        } finally {
            globalThis.fetch = original
        }
    })
})
