import { describe, expect, test } from 'vitest'
import tail from './tail'
import { runCommand } from './testUtils'

const numbers = (from, to) =>
    Array.from({ length: to - from + 1 }, (_, i) => `${from + i}`)
        .map((line) => `${line}\n`)
        .join('')

const tree = { 'many.txt': numbers(1, 12), 'short.txt': 'a\nb' }

describe('tail', () => {
    test('prints the last 10 lines by default', async () => {
        const { stdoutText, exitCode } = await runCommand(tail, ['many.txt'], { tree })
        expect(stdoutText()).toBe(numbers(3, 12))
        expect(exitCode).toBe(0)
    })

    test.each([[['-n', '2']], [['-n2']], [['-2']]])('reads the count from %j', async (argv) => {
        const { stdoutText } = await runCommand(tail, [...argv, 'many.txt'], { tree })
        expect(stdoutText()).toBe(numbers(11, 12))
    })

    test('prints everything when the count exceeds the lines', async () => {
        const { stdoutText } = await runCommand(tail, ['-n', '5'], { tree, stdin: 'x\ny' })
        expect(stdoutText()).toBe('x\ny\n')
    })

    test('prints nothing for -n 0', async () => {
        const { stdoutText } = await runCommand(tail, ['-0', 'many.txt'], { tree })
        expect(stdoutText()).toBe('')
    })

    test('prints headers and blank lines between several files', async () => {
        const { stdoutText } = await runCommand(tail, ['-1', 'many.txt', 'short.txt'], { tree })
        expect(stdoutText()).toBe('==> many.txt <==\n12\n\n==> short.txt <==\nb\n')
    })

    test('reports a missing file', async () => {
        const { stderrText, exitCode } = await runCommand(tail, ['nope'], { tree })
        expect(stderrText()).toBe('tail: nope: No such file or directory\n')
        expect(exitCode).toBe(1)
    })

    test('rejects an invalid number', async () => {
        const { stderrText, exitCode } = await runCommand(tail, ['-nx'], { tree, stdin: '' })
        expect(stderrText()).toBe("tail: invalid number of lines: 'x'\n")
        expect(exitCode).toBe(2)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(tail, ['-f', 'many.txt'], { tree })
        expect(stderrText()).toBe("tail: invalid option -- 'f'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(tail, [], { tree })
        expect(stderrText()).toBe('usage: tail [-n N] [file...]\n')
        expect(exitCode).toBe(2)
    })
})
