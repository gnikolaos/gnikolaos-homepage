import { describe, expect, test } from 'vitest'
import { isStyledSpan } from './isStyledSpan'

describe('isStyledSpan', () => {
    test('is false only for a span without color or attributes', () => {
        expect(isStyledSpan({ text: 'a', color: null, bold: false, underline: false })).toBe(false)
        expect(isStyledSpan({ text: 'a', color: 'red', bold: false, underline: false })).toBe(true)
        expect(isStyledSpan({ text: 'a', color: null, bold: true, underline: false })).toBe(true)
        expect(isStyledSpan({ text: 'a', color: null, bold: false, underline: true })).toBe(true)
    })
})
