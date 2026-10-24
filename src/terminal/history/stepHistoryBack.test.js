import { describe, expect, test } from 'vitest'
import { createNavigation } from './createNavigation'
import { stepHistoryBack } from './stepHistoryBack'

describe('stepHistoryBack', () => {
    const entries = ['ls', 'pwd', 'cat bio.md']

    test('returns null with no entries', () => {
        expect(stepHistoryBack(createNavigation(), [], 'x')).toBeNull()
    })

    test('first press shows the newest entry and stores the draft', () => {
        expect(stepHistoryBack(createNavigation(), entries, 'ec')).toEqual({
            nav: { index: 2, draft: 'ec' },
            input: 'cat bio.md',
        })
    })

    test('later presses walk back and keep the original draft', () => {
        const historyStep = stepHistoryBack({ index: 2, draft: 'ec' }, entries, 'cat bio.md')
        expect(historyStep).toEqual({ nav: { index: 1, draft: 'ec' }, input: 'pwd' })
    })

    test('returns null at the oldest entry', () => {
        expect(stepHistoryBack({ index: 0, draft: 'ec' }, entries, 'ls')).toBeNull()
    })
})
