import { describe, expect, test } from 'vitest'
import { stripAnsi } from './stripAnsi'
import { style } from './style'

describe('stripAnsi', () => {
    test('removes every SGR sequence and keeps the text', () => {
        expect(stripAnsi(`${style('a', 'red')} b ${style('c', 'bold')}\x1b[m`)).toBe('a b c')
    })

    test('leaves plain text untouched', () => {
        expect(stripAnsi('plain\ntext')).toBe('plain\ntext')
    })
})
