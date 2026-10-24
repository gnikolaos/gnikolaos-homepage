// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import { formatContent, renderText } from './utils'

describe('renderText', () => {
    test('splits text into characters and turns spaces into non-breaking spaces', () => {
        expect(renderText('a b  c')).toEqual(['a', ' ', 'b', ' ', ' ', 'c'])
    })

    test('returns an empty array for non-string input', () => {
        expect(renderText(/** @type {any} */ (undefined))).toEqual([])
        expect(renderText(/** @type {any} */ (42))).toEqual([])
    })
})

describe('formatContent', () => {
    test('returns a single segment for non-string input', () => {
        expect(formatContent(/** @type {any} */ (null))).toHaveLength(1)
    })

    test('returns one segment per line', () => {
        expect(formatContent('first line\nsecond line')).toHaveLength(2)
    })

    test('keeps the line text in each segment', () => {
        const segments = formatContent('first line\nsecond line').map((segment) => [segment].flat())
        expect(segments[0]).toContain('first line')
        expect(segments[1]).toContain('second line')
    })
})
