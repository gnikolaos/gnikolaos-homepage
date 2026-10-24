import { describe, expect, test } from 'vitest'
import { tokenizeLine } from './tokenizeLine'

/** @param {string} line */
const kindsAndTexts = (line) => tokenizeLine(line).map(({ kind, text }) => [kind, text])

describe('tokenizeLine', () => {
    test('returns no tokens for an empty line', () => {
        expect(tokenizeLine('')).toEqual([])
    })

    test('marks unquoted whitespace and pipes as breaks', () => {
        expect(kindsAndTexts('a b|c')).toEqual([
            ['wordPart', 'a'],
            ['wordBreak', ' '],
            ['wordPart', 'b'],
            ['stageBreak', '|'],
            ['wordPart', 'c'],
        ])
    })

    test('covers an escape with one part spanning both raw chars', () => {
        expect(tokenizeLine('\\|')).toEqual([{ kind: 'wordPart', start: 0, end: 2, text: '|' }])
    })

    test('yields empty parts for quote marks and one part per quoted char', () => {
        expect(tokenizeLine(`'a |'`)).toEqual([
            { kind: 'wordPart', start: 0, end: 1, text: '' },
            { kind: 'wordPart', start: 1, end: 2, text: 'a' },
            { kind: 'wordPart', start: 2, end: 3, text: ' ' },
            { kind: 'wordPart', start: 3, end: 4, text: '|' },
            { kind: 'wordPart', start: 4, end: 5, text: '' },
        ])
    })

    test('unescapes only quotes and backslashes inside double quotes', () => {
        expect(kindsAndTexts('"\\"\\n"')).toEqual([
            ['wordPart', ''],
            ['wordPart', '"'],
            ['wordPart', '\\'],
            ['wordPart', 'n'],
            ['wordPart', ''],
        ])
    })

    test.each([`'ab`, '"ab'])('ends with an unclosedQuote token at the end of %j', (line) => {
        expect(tokenizeLine(line).at(-1)).toEqual({ kind: 'unclosedQuote', start: 3, end: 3, text: '' })
    })
})
