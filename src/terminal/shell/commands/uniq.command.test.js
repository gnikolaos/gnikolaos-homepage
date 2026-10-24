import { describe, expect, test } from 'vitest'
import { runCommand } from '@test/runCommand'
import uniq from './uniq.command'

const tree = { 'a.txt': 'x\nx\ny\n' }

describe('uniq', () => {
    test('collapses adjacent duplicates only', async () => {
        const { stdoutText, exitCode } = await runCommand(uniq, [], { tree, stdin: 'a\na\nb\na\n' })
        expect(stdoutText()).toBe('a\nb\na\n')
        expect(exitCode).toBe(0)
    })

    test('prefixes counts with -c', async () => {
        const { stdoutText } = await runCommand(uniq, ['-c'], { tree, stdin: 'a\na\nb' })
        expect(stdoutText()).toBe('      2 a\n      1 b\n')
    })

    test('reads a file', async () => {
        const { stdoutText } = await runCommand(uniq, ['a.txt'], { tree })
        expect(stdoutText()).toBe('x\ny\n')
    })

    test('prints nothing for empty input', async () => {
        const { stdoutText } = await runCommand(uniq, [], { tree, stdin: '' })
        expect(stdoutText()).toBe('')
    })

    test('reports a missing file', async () => {
        const { stderrText, exitCode } = await runCommand(uniq, ['nope'], { tree })
        expect(stderrText()).toBe('uniq: nope: No such file or directory\n')
        expect(exitCode).toBe(1)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(uniq, ['-d'], { tree, stdin: '' })
        expect(stderrText()).toBe("uniq: invalid option -- 'd'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(uniq, [], { tree })
        expect(stderrText()).toBe('usage: uniq [-c]\n')
        expect(exitCode).toBe(2)
    })
})
