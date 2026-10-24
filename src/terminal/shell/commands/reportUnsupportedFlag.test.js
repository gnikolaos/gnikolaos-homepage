import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { reportUnsupportedFlag } from './reportUnsupportedFlag'

describe('reportUnsupportedFlag', () => {
    test('accepts supported flags', () => {
        const { ctx, stderrText } = createFakeCtx()
        expect(reportUnsupportedFlag(ctx, 'wc', new Set(['l', 'c']), 'lwc')).toBe(false)
        expect(stderrText()).toBe('')
    })

    test('reports the first unsupported flag', () => {
        const { ctx, stderrText } = createFakeCtx()
        expect(reportUnsupportedFlag(ctx, 'wc', new Set(['l', 'x']), 'lwc')).toBe(true)
        expect(stderrText()).toBe("wc: invalid option -- 'x'\n")
    })

    test('rejects long flags even when their letters are supported', () => {
        const { ctx } = createFakeCtx()
        expect(reportUnsupportedFlag(ctx, 'wc', new Set(['lw']), 'lwc')).toBe(true)
    })
})
