import { describe, expect, test } from 'vitest'
import { createFakeFetch } from '@test/createFakeFetch'
import { browserIo } from './browserIo'

const entries = [
    { name: 'posts', type: 'dir' },
    { name: 'bio.md', type: 'file', size: 10, mtime: '2026-10-24T12:00:00.000Z', title: 'About me' },
]

describe('browserIo', () => {
    test('uses globalThis.fetch', async () => {
        const originalFetch = globalThis.fetch
        const { fetchImpl, calls } = createFakeFetch(() => Response.json({ entries }))
        globalThis.fetch = fetchImpl
        try {
            expect(await browserIo.loadManifest('/dirs')).toEqual(entries)
            expect(calls).toEqual(['/dirs/_manifest.json'])
        } finally {
            globalThis.fetch = originalFetch
        }
    })
})
