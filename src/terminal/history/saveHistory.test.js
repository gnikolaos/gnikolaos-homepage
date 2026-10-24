import { describe, expect, test } from 'vitest'
import { createMemoryStorage } from '@gnikolaos/lib/shared/createMemoryStorage'
import { loadHistory } from './loadHistory'
import { saveHistory } from './saveHistory'

const HISTORY_KEY = 'terminal:history'

describe('saveHistory', () => {
    test('writes entries as JSON', () => {
        const storage = createMemoryStorage()
        saveHistory(storage, HISTORY_KEY, ['ls', 'cd posts'])
        expect(storage.getItem(HISTORY_KEY)).toBe('["ls","cd posts"]')
        expect(loadHistory(storage, HISTORY_KEY)).toEqual(['ls', 'cd posts'])
    })

    test('swallows quota errors', () => {
        const storage = {
            ...createMemoryStorage(),
            setItem: () => {
                throw new DOMException('full', 'QuotaExceededError')
            },
        }
        expect(() => saveHistory(storage, HISTORY_KEY, ['ls'])).not.toThrow()
    })
})
