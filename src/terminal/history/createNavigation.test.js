import { describe, expect, test } from 'vitest'
import { createNavigation } from './createNavigation'

describe('createNavigation', () => {
    test('starts on the draft', () => {
        expect(createNavigation()).toEqual({ index: null, draft: '' })
    })
})
