import { describe, expect, test } from 'vitest'
import { isStyled } from './isStyled'

describe('isStyled', () => {
    test('is false only for a span without color or attributes', () => {
        expect(isStyled({ text: 'a', color: null, bold: false, underline: false })).toBe(false)
        expect(isStyled({ text: 'a', color: 'red', bold: false, underline: false })).toBe(true)
        expect(isStyled({ text: 'a', color: null, bold: true, underline: false })).toBe(true)
        expect(isStyled({ text: 'a', color: null, bold: false, underline: true })).toBe(true)
    })
})
