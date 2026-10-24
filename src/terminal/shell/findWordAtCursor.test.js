import { describe, expect, test } from 'vitest'
import { findWordAtCursor } from './findWordAtCursor'

describe('findWordAtCursor', () => {
    test('returns an empty first word on an empty line', () => {
        expect(findWordAtCursor('', 0)).toEqual({ start: 0, end: 0, word: '', command: null })
    })

    test('finds the word around a cursor in the middle of it', () => {
        expect(findWordAtCursor('cat posts/x', 6)).toEqual({ start: 4, end: 11, word: 'po', command: 'cat' })
    })

    test('treats a cursor right after a separator as an empty word', () => {
        expect(findWordAtCursor('cat  x', 4)).toEqual({ start: 4, end: 4, word: '', command: 'cat' })
        expect(findWordAtCursor('cat |', 5)).toEqual({ start: 5, end: 5, word: '', command: null })
    })

    test('starts a new stage after an unquoted pipe', () => {
        expect(findWordAtCursor('cat a | gr', 10)).toMatchObject({ start: 8, word: 'gr', command: null })
        expect(findWordAtCursor('cat a|cd x', 10)).toMatchObject({ start: 9, word: 'x', command: 'cd' })
    })

    test('keeps quoted and escaped separators inside the word', () => {
        expect(findWordAtCursor('cat "my po" x', 11)).toEqual({ start: 4, end: 11, word: 'my po', command: 'cat' })
        expect(findWordAtCursor("cat 'a|b'", 9)).toMatchObject({ start: 4, word: 'a|b' })
        expect(findWordAtCursor('cat my\\ po', 10)).toMatchObject({ start: 4, word: 'my po' })
        expect(findWordAtCursor('echo a\\|b', 9)).toMatchObject({ start: 5, word: 'a|b', command: 'echo' })
    })

    test('unescapes double quoted escapes like the parser', () => {
        expect(findWordAtCursor('cat "a\\"b\\n', 11)).toMatchObject({ word: 'a"b\\n' })
    })

    test('treats an unterminated quote as ending at the cursor', () => {
        expect(findWordAtCursor('cat "my po', 10)).toEqual({ start: 4, end: 10, word: 'my po', command: 'cat' })
        expect(findWordAtCursor('cat "my po st', 10)).toEqual({ start: 4, end: 13, word: 'my po', command: 'cat' })
    })

    test('ends the word after a quote that closes past the cursor', () => {
        expect(findWordAtCursor('cat "my po" x', 8)).toEqual({ start: 4, end: 11, word: 'my ', command: 'cat' })
    })

    test('keeps a backslash right before the cursor literal but escapes the next char', () => {
        expect(findWordAtCursor('cat my\\ x', 7)).toEqual({ start: 4, end: 9, word: 'my\\', command: 'cat' })
    })

    test('counts an empty quoted word as the command', () => {
        expect(findWordAtCursor("'' x", 4)).toMatchObject({ start: 3, command: '' })
    })
})
