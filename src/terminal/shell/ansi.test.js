import { describe, expect, test } from 'vitest'
import { isStyled, parseAnsi, stripAnsi, style } from './ansi.js'

describe('style', () => {
    test('wraps text in an SGR sequence and a reset', () => {
        expect(style('posts', 'bold', 'blue')).toBe('\x1b[1;34mposts\x1b[0m')
    })
})

describe('stripAnsi', () => {
    test('removes every SGR sequence and keeps the text', () => {
        expect(stripAnsi(`${style('a', 'red')} b ${style('c', 'bold')}\x1b[m`)).toBe('a b c')
    })

    test('leaves plain text untouched', () => {
        expect(stripAnsi('plain\ntext')).toBe('plain\ntext')
    })
})

describe('parseAnsi', () => {
    test('returns one plain span for text without sequences', () => {
        expect(parseAnsi('hello')).toEqual([{ text: 'hello', color: null, bold: false, underline: false }])
    })

    test('returns no spans for empty text', () => {
        expect(parseAnsi('')).toEqual([])
    })

    test('splits text into styled spans', () => {
        expect(parseAnsi(`a ${style('b', 'bold', 'blue')} c`)).toEqual([
            { text: 'a ', color: null, bold: false, underline: false },
            { text: 'b', color: 'blue', bold: true, underline: false },
            { text: ' c', color: null, bold: false, underline: false },
        ])
    })

    test('keeps styles across lines until reset', () => {
        expect(parseAnsi('\x1b[31mone\ntwo\x1b[0m')).toEqual([
            { text: 'one\ntwo', color: 'red', bold: false, underline: false },
        ])
    })

    test('treats an empty parameter list as reset', () => {
        expect(parseAnsi('\x1b[4mu\x1b[mp')).toEqual([
            { text: 'u', color: null, bold: false, underline: true },
            { text: 'p', color: null, bold: false, underline: false },
        ])
    })

    test('supports bright colors and the single attribute resets', () => {
        expect(parseAnsi('\x1b[1;92mx\x1b[22;39my\x1b[24mz')).toEqual([
            { text: 'x', color: 'green', bold: true, underline: false },
            { text: 'y', color: null, bold: false, underline: false },
            { text: 'z', color: null, bold: false, underline: false },
        ])
    })

    test('ignores unknown codes', () => {
        expect(parseAnsi('\x1b[7mx')).toEqual([{ text: 'x', color: null, bold: false, underline: false }])
    })

    test('drops empty spans between adjacent sequences', () => {
        expect(parseAnsi('\x1b[1m\x1b[34mx\x1b[0m')).toEqual([
            { text: 'x', color: 'blue', bold: true, underline: false },
        ])
    })
})

describe('isStyled', () => {
    test('is false only for a span without color or attributes', () => {
        expect(isStyled({ text: 'a', color: null, bold: false, underline: false })).toBe(false)
        expect(isStyled({ text: 'a', color: 'red', bold: false, underline: false })).toBe(true)
        expect(isStyled({ text: 'a', color: null, bold: true, underline: false })).toBe(true)
        expect(isStyled({ text: 'a', color: null, bold: false, underline: true })).toBe(true)
    })
})
