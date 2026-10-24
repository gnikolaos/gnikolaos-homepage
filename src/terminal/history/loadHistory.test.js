import { describe, expect, test } from 'vitest'
import { createMemoryStorage } from '@gnikolaos/lib/shared/createMemoryStorage'
import { loadHistory } from './loadHistory'

const HISTORY_KEY = 'terminal:history'

describe('loadHistory', () => {
    test('returns stored entries', () => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, JSON.stringify(['ls', 'pwd']))
        expect(loadHistory(storage, HISTORY_KEY)).toEqual(['ls', 'pwd'])
    })

    test('returns [] when the key is missing', () => {
        expect(loadHistory(createMemoryStorage(), HISTORY_KEY)).toEqual([])
    })

    test.each(['{not json', '"ls"', '{"a":1}', 'null', '42'])('returns [] for corrupt value %j', (storedValue) => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, storedValue)
        expect(loadHistory(storage, HISTORY_KEY)).toEqual([])
    })

    test('drops non string entries', () => {
        const storage = createMemoryStorage()
        storage.setItem(HISTORY_KEY, JSON.stringify(['ls', 1, null, 'pwd', {}]))
        expect(loadHistory(storage, HISTORY_KEY)).toEqual(['ls', 'pwd'])
    })
})
