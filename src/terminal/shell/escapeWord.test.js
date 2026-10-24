import { describe, expect, test } from 'vitest'
import { escapeWord } from './escapeWord'
import { findWordAtCursor } from './findWordAtCursor'

describe('escapeWord', () => {
    test('leaves plain words alone', () => {
        expect(escapeWord('posts/post-1.md')).toBe('posts/post-1.md')
    })

    test('escapes spaces, quotes, backslashes and pipes', () => {
        expect(escapeWord(`my post's "a\\b"|c`)).toBe(`my\\ post\\'s\\ \\"a\\\\b\\"\\|c`)
    })

    test('round trips through the word scanner', () => {
        const word = `a b'c"d\\e|f`
        const escaped = escapeWord(word)
        expect(findWordAtCursor(`cat ${escaped}`, escaped.length + 4).word).toBe(word)
    })
})
