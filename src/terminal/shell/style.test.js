import { describe, expect, test } from 'vitest'
import { style } from './style'

describe('style', () => {
    test('wraps text in an SGR sequence and a reset', () => {
        expect(style('posts', 'bold', 'blue')).toBe('\x1b[1;34mposts\x1b[0m')
    })
})
