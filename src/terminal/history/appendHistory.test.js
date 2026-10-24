import { describe, expect, test } from 'vitest'
import { appendHistory } from './appendHistory'

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
        const appendedEntries = appendHistory(entries, 'new')
        expect(appendedEntries).toHaveLength(500)
        expect(appendedEntries[0]).toBe('cmd 1')
        expect(appendedEntries.at(-1)).toBe('new')
    })

    test('does not mutate the input array', () => {
        const entries = Object.freeze(['ls'])
        expect(appendHistory(entries, 'pwd')).not.toBe(entries)
        expect(entries).toEqual(['ls'])
    })
})
