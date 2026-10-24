import { describe, expect, test } from 'vitest'
import { ParseError } from './ParseError'

describe('ParseError', () => {
    test('is an Error named ParseError', () => {
        const error = new ParseError('boom')
        expect(error).toBeInstanceOf(Error)
        expect(error.name).toBe('ParseError')
        expect(error.message).toBe('boom')
    })
})
