import { describe, expect, test } from 'vitest'
import head from './head'
import { runCommand } from './testUtils'

const numbers = (from, to) =>
    Array.from({ length: to - from + 1 }, (_, i) => `${from + i}`)
        .map((line) => `${line}\n`)
        .join('')

const tree = { 'many.txt': numbers(1, 12), 'short.txt': 'a\nb' }

describe('head', () => {
    test('prints the first 10 lines by default', async () => {
        const { stdoutText, exitCode } = await runCommand(head, ['many.txt'], { tree })
        expect(stdoutText()).toBe(numbers(1, 10))
        expect(exitCode).toBe(0)
    })

    test.each([[['-n', '3']], [['-n3']], [['-3']]])('reads the count from %j', async (argv) => {
        const { stdoutText } = await runCommand(head, [...argv, 'many.txt'], { tree })
        expect(stdoutText()).toBe(numbers(1, 3))
    })

    test('reads stdin and ends the last line with a newline', async () => {
        const { stdoutText } = await runCommand(head, ['-n', '5'], { tree, stdin: 'x\ny' })
        expect(stdoutText()).toBe('x\ny\n')
    })

    test('prints nothing for -n 0', async () => {
        const { stdoutText } = await runCommand(head, ['-n0', 'many.txt'], { tree })
        expect(stdoutText()).toBe('')
    })

    test('prints headers and blank lines between several files', async () => {
        const { stdoutText } = await runCommand(head, ['-2', 'many.txt', 'short.txt'], { tree })
        expect(stdoutText()).toBe('==> many.txt <==\n1\n2\n\n==> short.txt <==\na\nb\n')
    })

    test('reports a missing file and keeps going', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(head, ['nope', 'short.txt'], { tree })
        expect(stderrText()).toBe('head: nope: No such file or directory\n')
        expect(stdoutText()).toBe('==> short.txt <==\na\nb\n')
        expect(exitCode).toBe(1)
    })

    test('rejects an invalid number', async () => {
        const { stderrText, exitCode } = await runCommand(head, ['-n', 'x'], { tree, stdin: '' })
        expect(stderrText()).toBe("head: invalid number of lines: 'x'\n")
        expect(exitCode).toBe(2)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(head, ['-q', 'many.txt'], { tree })
        expect(stderrText()).toBe("head: invalid option -- 'q'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(head, [], { tree })
        expect(stderrText()).toBe('usage: head [-n N] [file...]\n')
        expect(exitCode).toBe(2)
    })
})
