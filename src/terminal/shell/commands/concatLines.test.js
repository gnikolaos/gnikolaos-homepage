import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { concatLines } from './concatLines'

describe('concatLines', () => {
    test('joins the lines of every input', () => {
        const { ctx } = createFakeCtx()
        const inputs = [
            { label: null, text: 'a\nb' },
            { label: null, text: 'c\n' },
        ]
        expect(concatLines(ctx, inputs)).toEqual(['a', 'b', 'c'])
    })
})
