import { describe, expect, test } from 'vitest'
import { createFakeFetch } from '@test/createFakeFetch'
import { expectFsError } from '@test/expectFsError'
import { fetchFile } from './fetchFile'

describe('fetchFile', () => {
    test('returns the response text', async () => {
        const { fetchImpl, calls } = createFakeFetch(() => new Response('# Hello'))
        expect(await fetchFile('/dirs/posts/post-1.md', fetchImpl)).toBe('# Hello')
        expect(calls).toEqual(['/dirs/posts/post-1.md'])
    })

    test('404 throws ENOENT', async () => {
        const { fetchImpl } = createFakeFetch(() => new Response('', { status: 404 }))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'ENOENT', '/dirs/x.md')
    })

    test('other failures throw EIO', async () => {
        const { fetchImpl } = createFakeFetch(() => new Response('', { status: 500 }))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'EIO', '/dirs/x.md')
    })

    test('network failure throws EIO', async () => {
        const { fetchImpl } = createFakeFetch(() => Promise.reject(new TypeError('Failed to fetch')))
        await expectFsError(fetchFile('/dirs/x.md', fetchImpl), 'EIO', '/dirs/x.md')
    })

    test('non markdown or non content urls throw ENOENT without fetching', async () => {
        const { fetchImpl, calls } = createFakeFetch(() => new Response('x'))
        await expectFsError(fetchFile('/dirs/x.txt', fetchImpl), 'ENOENT', '/dirs/x.txt')
        await expectFsError(fetchFile('/secret.md', fetchImpl), 'ENOENT', '/secret.md')
        expect(calls).toEqual([])
    })
})
