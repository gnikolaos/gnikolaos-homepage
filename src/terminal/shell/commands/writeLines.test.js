import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { writeLines } from './writeLines'

describe('writeLines', () => {
    test('writes every line with a newline', () => {
        const { ctx, recorded } = createFakeCtx()
        writeLines(ctx, ['a', 'b'])
        expect(recorded.stdout).toEqual(['a\nb\n'])
    })

    test('writes nothing for no lines', () => {
        const { ctx, recorded } = createFakeCtx()
        writeLines(ctx, [])
        expect(recorded.stdout).toEqual([])
    })
})
