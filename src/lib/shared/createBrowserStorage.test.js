import { afterEach, describe, expect, test, vi } from 'vitest'
import { createBrowserStorage } from './createBrowserStorage'
import { createMemoryStorage } from './createMemoryStorage'

describe('createBrowserStorage', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    test('returns sessionStorage when it is available', () => {
        const sessionStorage = createMemoryStorage()
        vi.stubGlobal('sessionStorage', sessionStorage)
        expect(createBrowserStorage('sessionStorage')).toBe(sessionStorage)
    })

    test('returns localStorage when it is available', () => {
        const localStorage = createMemoryStorage()
        vi.stubGlobal('localStorage', localStorage)
        vi.stubGlobal('sessionStorage', createMemoryStorage())
        expect(createBrowserStorage('localStorage')).toBe(localStorage)
    })

    test('falls back to a working memory storage when the storage is undefined', () => {
        vi.stubGlobal('localStorage', undefined)
        const storage = createBrowserStorage('localStorage')
        storage.setItem('key', 'value')
        expect(storage.getItem('key')).toBe('value')
    })

    test('falls back to a memory storage when accessing the storage throws', () => {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
        Object.defineProperty(globalThis, 'sessionStorage', {
            configurable: true,
            get: () => {
                throw new DOMException('denied', 'SecurityError')
            },
        })
        try {
            const storage = createBrowserStorage('sessionStorage')
            storage.setItem('key', 'value')
            expect(storage.getItem('key')).toBe('value')
        } finally {
            if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor)
            else delete globalThis.sessionStorage
        }
    })
})
