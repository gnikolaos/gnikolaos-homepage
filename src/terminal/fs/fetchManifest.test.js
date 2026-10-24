import { describe, expect, test } from 'vitest'
import { createFakeFetch } from '@test/createFakeFetch'
import { expectFsError } from '@test/expectFsError'
import { fetchManifest } from './fetchManifest'

const entries = [
    { name: 'posts', type: 'dir' },
    { name: 'bio.md', type: 'file', size: 10, mtime: '2026-10-24T12:00:00.000Z', title: 'About me' },
]

describe('fetchManifest', () => {
    test('fetches the manifest next to the dir url and returns its entries', async () => {
        const { fetchImpl, calls } = createFakeFetch(() => Response.json({ entries }))
        expect(await fetchManifest('/dirs/about-me', fetchImpl)).toEqual(entries)
        expect(calls).toEqual(['/dirs/about-me/_manifest.json'])
    })

    test('works for the content root', async () => {
        const { fetchImpl, calls } = createFakeFetch(() => Response.json({ entries: [] }))
        expect(await fetchManifest('/dirs', fetchImpl)).toEqual([])
        expect(calls).toEqual(['/dirs/_manifest.json'])
    })

    test('ignores the content type header', async () => {
        const body = JSON.stringify({ entries })
        const { fetchImpl } = createFakeFetch(() => new Response(body, { headers: { 'Content-Type': 'text/html' } }))
        expect(await fetchManifest('/dirs', fetchImpl)).toEqual(entries)
    })

    test('non ok response throws ENOENT', async () => {
        const { fetchImpl } = createFakeFetch(() => new Response('', { status: 404 }))
        await expectFsError(fetchManifest('/dirs/nope', fetchImpl), 'ENOENT', '/dirs/nope')
    })

    test('network failure throws EIO', async () => {
        const { fetchImpl } = createFakeFetch(() => Promise.reject(new TypeError('Failed to fetch')))
        await expectFsError(fetchManifest('/dirs', fetchImpl), 'EIO', '/dirs')
    })

    test('invalid json throws EIO', async () => {
        const { fetchImpl } = createFakeFetch(() => new Response('<!doctype html>'))
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
        const { fetchImpl } = createFakeFetch(() => Response.json(body))
        await expectFsError(fetchManifest('/dirs', fetchImpl), 'EIO', '/dirs')
    })

    test('urls outside /dirs throw ENOENT without fetching', async () => {
        const { fetchImpl, calls } = createFakeFetch(() => Response.json({ entries }))
        await expectFsError(fetchManifest('/etc', fetchImpl), 'ENOENT', '/etc')
        await expectFsError(fetchManifest('/dirsx', fetchImpl), 'ENOENT', '/dirsx')
        expect(calls).toEqual([])
    })
})
