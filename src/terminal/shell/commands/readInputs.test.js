import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { createFakeFile } from '@test/createFakeFile'
import { readInputs } from './readInputs'

const tree = {
    'a.txt': 'one\ntwo\n',
    'b.txt': 'three',
    posts: {},
    'broken.txt': createFakeFile('', { failRead: true }),
}

describe('readInputs', () => {
    test('reads files labelled as typed', async () => {
        const { ctx } = createFakeCtx({ tree })
        expect(await readInputs(ctx, 'x', ['a.txt', './b.txt'], 'ignored')).toEqual({
            inputs: [
                { label: 'a.txt', text: 'one\ntwo\n' },
                { label: './b.txt', text: 'three' },
            ],
            failed: false,
        })
    })

    test('reports fs errors and keeps going', async () => {
        const { ctx, stderrText } = createFakeCtx({ tree })
        const result = await readInputs(ctx, 'x', ['nope', 'posts', 'broken.txt', 'b.txt'], null)
        expect(result).toEqual({ inputs: [{ label: 'b.txt', text: 'three' }], failed: true })
        expect(stderrText()).toBe(
            'x: nope: No such file or directory\nx: posts: Is a directory\nx: broken.txt: Input/output error\n',
        )
    })

    test('uses stdin without files', async () => {
        const { ctx } = createFakeCtx({ tree })
        expect(await readInputs(ctx, 'x', [], 'piped')).toEqual({
            inputs: [{ label: null, text: 'piped' }],
            failed: false,
        })
    })

    test('returns no inputs without files or stdin', async () => {
        const { ctx } = createFakeCtx({ tree })
        expect(await readInputs(ctx, 'x', [], null)).toEqual({ inputs: [], failed: false })
    })

    test('lets non-fs errors propagate', async () => {
        const { ctx } = createFakeCtx({ tree })
        ctx.fs.readFile = async () => {
            throw new Error('boom')
        }
        await expect(readInputs(ctx, 'x', ['a.txt'], null)).rejects.toThrow('boom')
    })

    test('stops reading once aborted', async () => {
        const controller = new AbortController()
        controller.abort()
        const { ctx } = createFakeCtx({ tree, signal: controller.signal })
        expect(await readInputs(ctx, 'x', ['a.txt'], null)).toEqual({ inputs: [], failed: false })
    })
})
