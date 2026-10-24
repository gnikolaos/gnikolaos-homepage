import { describe, expect, test } from 'vitest'
import { searchHistory } from './searchHistory'

describe('searchHistory', () => {
    const entries = ['ls posts', 'cat about.md', 'cd posts', 'pwd']

    test('returns the newest matching index at or below fromIndex', () => {
        expect(searchHistory(entries, 'posts', 3)).toBe(2)
        expect(searchHistory(entries, 'posts', 2)).toBe(2)
        expect(searchHistory(entries, 'posts', 1)).toBe(0)
    })

    test('matches a plain case-sensitive substring', () => {
        expect(searchHistory(entries, 'bout.', 3)).toBe(1)
        expect(searchHistory(entries, 'POSTS', 3)).toBeNull()
        expect(searchHistory(['a.b', 'axb'], 'a.b', 1)).toBe(0)
    })

    test('clamps fromIndex past the end', () => {
        expect(searchHistory(entries, 'pwd', 99)).toBe(3)
    })

    test('returns null for an empty query, a negative fromIndex or no match', () => {
        expect(searchHistory(entries, '', 3)).toBeNull()
        expect(searchHistory(entries, 'ls', -1)).toBeNull()
        expect(searchHistory(entries, 'nope', 3)).toBeNull()
        expect(searchHistory([], 'ls', 0)).toBeNull()
    })
})
