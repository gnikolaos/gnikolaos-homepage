import { describe, expect, test } from 'vitest'
import { appendHistory, createNavigation, historyDown, historyUp, loadHistory, saveHistory } from './history.js'

const KEY = 'terminal:history'

const memoryStorage = (initial = {}) => {
    const data = { ...initial }
    return {
        data,
        getItem: (k) => (Object.hasOwn(data, k) ? data[k] : null),
        setItem: (k, v) => {
            data[k] = String(v)
        },
        removeItem: (k) => {
            delete data[k]
        },
    }
}

describe('loadHistory', () => {
    test('returns stored entries', () => {
        const storage = memoryStorage({ [KEY]: JSON.stringify(['ls', 'pwd']) })
        expect(loadHistory(storage, KEY)).toEqual(['ls', 'pwd'])
    })

    test('returns [] when the key is missing', () => {
        expect(loadHistory(memoryStorage(), KEY)).toEqual([])
    })

    test.each(['{not json', '"ls"', '{"a":1}', 'null', '42'])('returns [] for corrupt value %j', (raw) => {
        expect(loadHistory(memoryStorage({ [KEY]: raw }), KEY)).toEqual([])
    })

    test('drops non string entries', () => {
        const storage = memoryStorage({ [KEY]: JSON.stringify(['ls', 1, null, 'pwd', {}]) })
        expect(loadHistory(storage, KEY)).toEqual(['ls', 'pwd'])
    })

    test('returns [] when storage throws', () => {
        const storage = {
            ...memoryStorage(),
            getItem: () => {
                throw new Error('SecurityError')
            },
        }
        expect(loadHistory(storage, KEY)).toEqual([])
    })
})

describe('saveHistory', () => {
    test('writes entries as JSON', () => {
        const storage = memoryStorage()
        saveHistory(storage, KEY, ['ls', 'cd posts'])
        expect(storage.data[KEY]).toBe('["ls","cd posts"]')
        expect(loadHistory(storage, KEY)).toEqual(['ls', 'cd posts'])
    })

    test('swallows quota errors', () => {
        const storage = {
            ...memoryStorage(),
            setItem: () => {
                throw new DOMException('full', 'QuotaExceededError')
            },
        }
        expect(() => saveHistory(storage, KEY, ['ls'])).not.toThrow()
    })
})

describe('appendHistory', () => {
    test('appends the trimmed line', () => {
        expect(appendHistory(['ls'], '  pwd  ')).toEqual(['ls', 'pwd'])
    })

    test('skips blank lines', () => {
        expect(appendHistory(['ls'], '   ')).toEqual(['ls'])
        expect(appendHistory([], '')).toEqual([])
    })

    test('skips a line equal to the last entry', () => {
        expect(appendHistory(['ls', 'pwd'], ' pwd')).toEqual(['ls', 'pwd'])
    })

    test('keeps non consecutive duplicates', () => {
        expect(appendHistory(['ls', 'pwd'], 'ls')).toEqual(['ls', 'pwd', 'ls'])
    })

    test('caps to max keeping the newest', () => {
        expect(appendHistory(['a', 'b', 'c'], 'd', { max: 3 })).toEqual(['b', 'c', 'd'])
    })

    test('defaults the cap to 500', () => {
        const entries = Array.from({ length: 500 }, (_, i) => `cmd ${i}`)
        const next = appendHistory(entries, 'new')
        expect(next).toHaveLength(500)
        expect(next[0]).toBe('cmd 1')
        expect(next.at(-1)).toBe('new')
    })

    test('does not mutate the input array', () => {
        const entries = Object.freeze(['ls'])
        expect(appendHistory(entries, 'pwd')).not.toBe(entries)
        expect(entries).toEqual(['ls'])
    })
})

describe('createNavigation', () => {
    test('starts on the draft', () => {
        expect(createNavigation()).toEqual({ index: null, draft: '' })
    })
})

describe('historyUp', () => {
    const entries = ['ls', 'pwd', 'cat bio.md']

    test('returns null with no entries', () => {
        expect(historyUp(createNavigation(), [], 'x')).toBeNull()
    })

    test('first press shows the newest entry and stores the draft', () => {
        expect(historyUp(createNavigation(), entries, 'ec')).toEqual({
            nav: { index: 2, draft: 'ec' },
            input: 'cat bio.md',
        })
    })

    test('later presses walk back and keep the original draft', () => {
        const step = historyUp({ index: 2, draft: 'ec' }, entries, 'cat bio.md')
        expect(step).toEqual({ nav: { index: 1, draft: 'ec' }, input: 'pwd' })
    })

    test('returns null at the oldest entry', () => {
        expect(historyUp({ index: 0, draft: 'ec' }, entries, 'ls')).toBeNull()
    })
})

describe('historyDown', () => {
    const entries = ['ls', 'pwd', 'cat bio.md']

    test('returns null when not navigating', () => {
        expect(historyDown(createNavigation(), entries)).toBeNull()
    })

    test('walks forward keeping the draft', () => {
        expect(historyDown({ index: 0, draft: 'ec' }, entries)).toEqual({
            nav: { index: 1, draft: 'ec' },
            input: 'pwd',
        })
    })

    test('past the newest entry restores the draft and leaves navigation', () => {
        const step = historyDown({ index: 2, draft: 'ec' }, entries)
        expect(step?.input).toBe('ec')
        expect(step?.nav.index).toBeNull()
    })

    test('a full up and down round trip returns to the draft', () => {
        let nav = createNavigation()
        let input = 'draft'
        for (let i = 0; i < 3; i++) ({ nav, input } = historyUp(nav, entries, input))
        expect(input).toBe('ls')
        expect(historyUp(nav, entries, input)).toBeNull()
        for (let i = 0; i < 3; i++) ({ nav, input } = historyDown(nav, entries))
        expect({ nav: nav.index, input }).toEqual({ nav: null, input: 'draft' })
        expect(historyDown(nav, entries)).toBeNull()
    })
})
