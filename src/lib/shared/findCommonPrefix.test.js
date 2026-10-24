import { describe, expect, test } from 'vitest'
import { findCommonPrefix } from './findCommonPrefix'

describe('findCommonPrefix', () => {
    test('returns an empty string for no words', () => {
        expect(findCommonPrefix([])).toBe('')
    })

    test('returns the single word', () => {
        expect(findCommonPrefix(['posts/'])).toBe('posts/')
    })

    test('returns the longest shared prefix', () => {
        expect(findCommonPrefix(['posts/post-1.md', 'posts/post-2.md', 'posts/pre'])).toBe('posts/p')
        expect(findCommonPrefix(['abc', 'xyz'])).toBe('')
    })
})
