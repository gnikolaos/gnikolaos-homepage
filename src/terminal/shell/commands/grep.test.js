import { describe, expect, test } from 'vitest'
import { stripAnsi } from '../ansi'
import grep from './grep'
import { runCommand } from './testUtils'

const tree = { 'a.txt': 'apple\nBanana\ncherry\n', 'b.txt': 'banana split' }

describe('grep', () => {
    test('highlights matches in bold red', async () => {
        const { stdoutText, exitCode } = await runCommand(grep, ['an'], { tree, stdin: 'banana\nkiwi\n' })
        expect(stdoutText()).toBe('b\x1b[1;31man\x1b[0m\x1b[1;31man\x1b[0ma\n')
        expect(exitCode).toBe(0)
    })

    test('reads a file', async () => {
        const { stdoutText } = await runCommand(grep, ['rr', 'a.txt'], { tree })
        expect(stripAnsi(stdoutText())).toBe('cherry\n')
    })

    test('treats the pattern as a regular expression', async () => {
        const { stdoutText } = await runCommand(grep, ['^[ac]', 'a.txt'], { tree })
        expect(stripAnsi(stdoutText())).toBe('apple\ncherry\n')
    })

    test('ignores case with -i', async () => {
        const { stdoutText } = await runCommand(grep, ['-i', 'banana', 'a.txt'], { tree })
        expect(stdoutText()).toBe('\x1b[1;31mBanana\x1b[0m\n')
    })

    test('inverts with -v and leaves lines unstyled', async () => {
        const { stdoutText } = await runCommand(grep, ['-v', 'an', 'a.txt'], { tree })
        expect(stdoutText()).toBe('apple\ncherry\n')
    })

    test('numbers lines with -n', async () => {
        const { stdoutText } = await runCommand(grep, ['-n', 'e', 'a.txt'], { tree })
        expect(stripAnsi(stdoutText())).toBe('1:apple\n3:cherry\n')
    })

    test('prefixes file names for several files', async () => {
        const { stdoutText } = await runCommand(grep, ['-in', 'banana', 'a.txt', 'b.txt'], { tree })
        expect(stripAnsi(stdoutText())).toBe('a.txt:2:Banana\nb.txt:1:banana split\n')
    })

    test('does not highlight zero-length matches', async () => {
        const { stdoutText, exitCode } = await runCommand(grep, ['^'], { tree, stdin: 'x\n\n' })
        expect(stdoutText()).toBe('x\n\n')
        expect(exitCode).toBe(0)
    })

    test('exits 1 when nothing matches', async () => {
        const { stdoutText, exitCode } = await runCommand(grep, ['zzz', 'a.txt'], { tree })
        expect(stdoutText()).toBe('')
        expect(exitCode).toBe(1)
    })

    test('exits 2 on a missing file even with matches', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(grep, ['apple', 'nope', 'a.txt'], { tree })
        expect(stderrText()).toBe('grep: nope: No such file or directory\n')
        expect(stripAnsi(stdoutText())).toBe('a.txt:apple\n')
        expect(exitCode).toBe(2)
    })

    test('rejects an invalid regular expression', async () => {
        const { stderrText, exitCode } = await runCommand(grep, ['('], { tree, stdin: 'x' })
        expect(stderrText()).toMatch(/^grep: invalid regular expression: .+\n$/)
        expect(exitCode).toBe(2)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(grep, ['-E', 'x', 'a.txt'], { tree })
        expect(stderrText()).toBe("grep: invalid option -- 'E'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without a pattern', async () => {
        const { stderrText, exitCode } = await runCommand(grep, [], { tree, stdin: 'x' })
        expect(stderrText()).toBe('usage: grep [-inv] pattern [file...]\n')
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(grep, ['x'], { tree })
        expect(stderrText()).toBe('usage: grep [-inv] pattern [file...]\n')
        expect(exitCode).toBe(2)
    })
})
