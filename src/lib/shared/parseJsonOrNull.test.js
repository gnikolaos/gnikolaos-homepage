import { describe, expect, test } from 'vitest'
import { parseJsonOrNull } from './parseJsonOrNull'

describe('parseJsonOrNull', () => {
    test('returns the parsed value for valid JSON', () => {
        expect(parseJsonOrNull('{"a":[1,"b"]}')).toEqual({ a: [1, 'b'] })
    })

    test('returns null for null input', () => {
        expect(parseJsonOrNull(null)).toBeNull()
    })

    test('returns null for corrupt JSON', () => {
        expect(parseJsonOrNull('{not json')).toBeNull()
    })
})
