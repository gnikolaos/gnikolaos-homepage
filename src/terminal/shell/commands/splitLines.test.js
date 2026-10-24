import { describe, expect, test } from 'vitest'
import { splitLines } from './splitLines'

describe('splitLines', () => {
    test('returns no lines for empty text', () => {
        expect(splitLines('')).toEqual([])
    })

    test('drops the element after a trailing newline', () => {
        expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    })

    test('keeps a last line without newline', () => {
        expect(splitLines('a\nb')).toEqual(['a', 'b'])
    })

    test('keeps empty lines in the middle', () => {
        expect(splitLines('\n\na\n')).toEqual(['', '', 'a'])
    })
})
