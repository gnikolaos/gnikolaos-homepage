import { describe, expect, test } from 'vitest'
import { formatColumns } from './formatColumns'

describe('formatColumns', () => {
    test('returns an empty string for no names', () => {
        expect(formatColumns([], 80)).toBe('')
    })

    test('puts everything on one line when it fits', () => {
        expect(formatColumns(['a', 'bb', 'ccc'], 80)).toBe('a  bb  ccc\n')
    })

    test('fills columns down then across, padded to their widest name', () => {
        expect(formatColumns(['a', 'bbbb', 'cc', 'd', 'eeeee'], 14)).toBe('a     d\nbbbb  eeeee\ncc\n')
    })

    test('leaves no trailing spaces on a line', () => {
        const output = formatColumns(['alpha', 'b', 'gamma', 'delta', 'e'], 16)
        expect(output).toBe('alpha  gamma  e\nb      delta\n')
        expect(output.split('\n').every((line) => line === line.trimEnd())).toBe(true)
    })

    test('uses the exact width as the limit', () => {
        expect(formatColumns(['abc', 'def'], 8)).toBe('abc  def\n')
        expect(formatColumns(['abc', 'def'], 7)).toBe('abc\ndef\n')
    })

    test('gives a name wider than the width a row of its own', () => {
        expect(formatColumns(['a', 'very-long-name', 'b'], 6)).toBe('a\nvery-long-name\nb\n')
    })

    test('treats a width below 1 as 1', () => {
        expect(formatColumns(['a', 'b'], 0)).toBe('a\nb\n')
        expect(formatColumns(['a'], -5)).toBe('a\n')
    })
})
