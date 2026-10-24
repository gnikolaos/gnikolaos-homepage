import { describe, expect, test } from 'vitest'
import { createMemoryStorage } from './createMemoryStorage'

describe('createMemoryStorage', () => {
    test('returns null for a missing key', () => {
        expect(createMemoryStorage().getItem('missing')).toBeNull()
    })

    test('stores values as strings', () => {
        const storage = createMemoryStorage()
        storage.setItem('key', 'value')
        expect(storage.getItem('key')).toBe('value')
    })

    test('removes a key', () => {
        const storage = createMemoryStorage()
        storage.setItem('key', 'value')
        storage.removeItem('key')
        expect(storage.getItem('key')).toBeNull()
    })

    test('keeps instances separate', () => {
        const first = createMemoryStorage()
        first.setItem('key', 'value')
        expect(createMemoryStorage().getItem('key')).toBeNull()
    })
})
