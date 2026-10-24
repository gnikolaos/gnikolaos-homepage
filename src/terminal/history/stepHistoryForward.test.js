import { describe, expect, test } from 'vitest'
import { createNavigation } from './createNavigation'
import { stepHistoryBack } from './stepHistoryBack'
import { stepHistoryForward } from './stepHistoryForward'

describe('stepHistoryForward', () => {
    const entries = ['ls', 'pwd', 'cat bio.md']

    test('returns null when not navigating', () => {
        expect(stepHistoryForward(createNavigation(), entries)).toBeNull()
    })

    test('walks forward keeping the draft', () => {
        expect(stepHistoryForward({ index: 0, draft: 'ec' }, entries)).toEqual({
            nav: { index: 1, draft: 'ec' },
            input: 'pwd',
        })
    })

    test('past the newest entry restores the draft and leaves navigation', () => {
        const historyStep = stepHistoryForward({ index: 2, draft: 'ec' }, entries)
        expect(historyStep?.input).toBe('ec')
        expect(historyStep?.nav.index).toBeNull()
    })

    test('a full up and down round trip returns to the draft', () => {
        let nav = createNavigation()
        let input = 'draft'
        for (let i = 0; i < 3; i++) ({ nav, input } = stepHistoryBack(nav, entries, input))
        expect(input).toBe('ls')
        expect(stepHistoryBack(nav, entries, input)).toBeNull()
        for (let i = 0; i < 3; i++) ({ nav, input } = stepHistoryForward(nav, entries))
        expect({ nav: nav.index, input }).toEqual({ nav: null, input: 'draft' })
        expect(stepHistoryForward(nav, entries)).toBeNull()
    })
})
