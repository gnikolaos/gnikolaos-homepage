import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { createFakeFile } from '@test/createFakeFile'
import {
    concatLines,
    parseLineCount,
    readInputs,
    reportUnsupportedFlag,
    splitLines,
    usageError,
    writeLines,
} from './textInput'

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

describe('splitLines', () => {
    test('returns no lines for empty text', () => {
        expect(splitLines('')).toEqual([])
    })

    test('drops the element after a trailing newline', () => {
        expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    })

    test('keeps a last line without newline', () => {
        expect(splitLines('a\nb')).toEqual(['a', 'b'])
    })

    test('keeps empty lines in the middle', () => {
        expect(splitLines('\n\na\n')).toEqual(['', '', 'a'])
    })
})

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

describe('parseLineCount', () => {
    test('defaults to 10', () => {
        expect(parseLineCount(['a.txt'], 'head')).toEqual({ count: 10, rest: ['a.txt'], error: null })
    })

    test.each([[['-n', '5']], [['-n5']], [['-5']]])('reads %j', (argv) => {
        expect(parseLineCount([...argv, 'a.txt'], 'head')).toEqual({ count: 5, rest: ['a.txt'], error: null })
    })

    test('keeps other flags and everything after --', () => {
        expect(parseLineCount(['-x', '--', '-3'], 'head')).toEqual({ count: 10, rest: ['-x', '--', '-3'], error: null })
    })

    test('rejects a non-numeric value', () => {
        expect(parseLineCount(['-n', 'abc'], 'tail').error).toBe("tail: invalid number of lines: 'abc'")
        expect(parseLineCount(['-n-2'], 'tail').error).toBe("tail: invalid number of lines: '-2'")
    })

    test('rejects a missing value', () => {
        expect(parseLineCount(['-n'], 'head').error).toBe("head: option requires an argument -- 'n'")
    })
})

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

describe('usageError', () => {
    test('prints the usage and returns 2', () => {
        const { ctx, stderrText } = createFakeCtx()
        expect(usageError(ctx, 'wc [-lwc] [file...]')).toBe(2)
        expect(stderrText()).toBe('usage: wc [-lwc] [file...]\n')
    })
})
