import { describe, expect, test } from 'vitest'
import sort from './sort'
import { runCommand } from '@test/runCommand'

const tree = { 'a.txt': 'pear\napple\n', 'b.txt': 'Zebra\nbanana' }

describe('sort', () => {
    test('sorts stdin in code point order', async () => {
        const { stdoutText, exitCode } = await runCommand(sort, [], { tree, stdin: 'b\na\nB\nä\n' })
        expect(stdoutText()).toBe('B\na\nb\nä\n')
        expect(exitCode).toBe(0)
    })

    test('concatenates several files before sorting', async () => {
        const { stdoutText } = await runCommand(sort, ['a.txt', 'b.txt'], { tree })
        expect(stdoutText()).toBe('Zebra\napple\nbanana\npear\n')
    })

    test('reverses with -r', async () => {
        const { stdoutText } = await runCommand(sort, ['-r', 'a.txt'], { tree })
        expect(stdoutText()).toBe('pear\napple\n')
    })

    test('compares leading numbers with -n, non-numbers as 0', async () => {
        const { stdoutText } = await runCommand(sort, ['-n'], { tree, stdin: '10 ten\n2\n-1\nx\n1.5\n' })
        expect(stdoutText()).toBe('-1\nx\n1.5\n2\n10 ten\n')
    })

    test('combines -n and -r', async () => {
        const { stdoutText } = await runCommand(sort, ['-nr'], { tree, stdin: '2\n10\n1\n' })
        expect(stdoutText()).toBe('10\n2\n1\n')
    })

    test('drops duplicates with -u', async () => {
        const { stdoutText } = await runCommand(sort, ['-u'], { tree, stdin: 'b\na\nb\na\n' })
        expect(stdoutText()).toBe('a\nb\n')
    })

    test('reports a missing file and sorts the rest', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(sort, ['nope', 'a.txt'], { tree })
        expect(stderrText()).toBe('sort: nope: No such file or directory\n')
        expect(stdoutText()).toBe('apple\npear\n')
        expect(exitCode).toBe(1)
    })

    test('rejects an unsupported flag', async () => {
        const { stderrText, exitCode } = await runCommand(sort, ['-k'], { tree, stdin: '' })
        expect(stderrText()).toBe("sort: invalid option -- 'k'\n")
        expect(exitCode).toBe(2)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(sort, [], { tree })
        expect(stderrText()).toBe('usage: sort [-r] [-n] [-u]\n')
        expect(exitCode).toBe(2)
    })
})
