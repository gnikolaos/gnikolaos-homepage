import { describe, expect, test } from 'vitest'
import { splitFlags } from './splitFlags'

describe('splitFlags', () => {
    test('returns empty results for no args', () => {
        expect(splitFlags([])).toEqual({ flags: new Set(), positionals: [] })
    })

    test('splits combined short flags', () => {
        expect(splitFlags(['-la'])).toEqual({ flags: new Set(['l', 'a']), positionals: [] })
    })

    test('reads long flags by name', () => {
        expect(splitFlags(['--all'])).toEqual({ flags: new Set(['all']), positionals: [] })
    })

    test('separates flags from positionals in any order', () => {
        expect(splitFlags(['posts', '-l', 'about', '--all'])).toEqual({
            flags: new Set(['l', 'all']),
            positionals: ['posts', 'about'],
        })
    })

    test('treats a lone dash as positional', () => {
        expect(splitFlags(['-', '-a'])).toEqual({ flags: new Set(['a']), positionals: ['-'] })
    })

    test('stops parsing flags after --', () => {
        expect(splitFlags(['-a', '--', '-l', '--all', '--'])).toEqual({
            flags: new Set(['a']),
            positionals: ['-l', '--all', '--'],
        })
    })

    test('does not mutate argv', () => {
        const argv = ['-a', 'x']
        splitFlags(argv)
        expect(argv).toEqual(['-a', 'x'])
    })
})
