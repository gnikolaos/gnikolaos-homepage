import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { reportUsageError } from './reportUsageError'

describe('reportUsageError', () => {
    test('prints the usage and returns 2', () => {
        const { ctx, stderrText } = createFakeCtx()
        expect(reportUsageError(ctx, 'wc [-lwc] [file...]')).toBe(2)
        expect(stderrText()).toBe('usage: wc [-lwc] [file...]\n')
    })
})
