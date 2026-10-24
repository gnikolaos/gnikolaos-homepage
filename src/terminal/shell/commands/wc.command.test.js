import { describe, expect, test } from 'vitest'
import { runCommand } from '@test/runCommand'
import wc from './wc.command'

const tree = { 'a.txt': 'one two\nthree\n', 'b.txt': 'καλημέρα' }

describe('wc', () => {
    test('prints lines, words and bytes of stdin aligned to the widest number', async () => {
        const { stdoutText, exitCode } = await runCommand(wc, [], { tree, stdin: 'one two\nthree\n' })
        expect(stdoutText()).toBe(' 2  3 14\n')
        expect(exitCode).toBe(0)
    })

    test('prints only the number for one count on stdin', async () => {
        const { stdoutText } = await runCommand(wc, ['-l'], { tree, stdin: 'a\nb\nc\n' })
        expect(stdoutText()).toBe('3\n')
    })

    test('counts bytes as UTF-8 and lines as newlines', async () => {
        const { stdoutText } = await runCommand(wc, ['b.txt'], { tree })
        expect(stdoutText()).toBe(' 0  1 16 b.txt\n')
    })

    test('selects counts in l w c order', async () => {
        const { stdoutText } = await runCommand(wc, ['-cl', 'a.txt'], { tree })
        expect(stdoutText()).toBe(' 2 14 a.txt\n')
    })

    test('adds a total row for several files', async () => {
        const { stdoutText } = await runCommand(wc, ['-w', 'a.txt', 'b.txt'], { tree })
        expect(stdoutText()).toBe('3 a.txt\n1 b.txt\n4 total\n')
    })

    test('counts empty input as zeros', async () => {
        const { stdoutText } = await runCommand(wc, [], { tree, stdin: '' })
        expect(stdoutText()).toBe('0 0 0\n')
    })

    test('reports a missing file and keeps going', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(wc, ['-l', 'nope', 'a.txt'], { tree })
        expect(stderrText()).toBe('wc: nope: No such file or directory\n')
        expect(stdoutText()).toBe('2 a.txt\n2 total\n')
        expect(exitCode).toBe(1)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(wc, ['-m'], { tree, stdin: '' })
        expect(stderrText()).toBe("wc: invalid option -- 'm'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(wc, [], { tree })
        expect(stderrText()).toBe('usage: wc [-lwc] [file...]\n')
        expect(exitCode).toBe(2)
    })
})
