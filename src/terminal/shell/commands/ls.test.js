import { describe, expect, test } from 'vitest'
import ls, { humanSize, shortDate } from './ls'
import { HOME, file, runCommand } from './testUtils'

const tree = {
    posts: {
        'post-1.md': file('# Hi', { size: 1234, mtime: '2026-10-24T12:00:00.000Z' }),
        'post-2.md': file('# Two', { size: 340 }),
    },
    'bio.md': file('# Bio', { size: 2048, mtime: '2026-01-02T00:00:00.000Z' }),
}

describe('ls', () => {
    test('lists the cwd with dirs ending in a slash', async () => {
        const { stdoutText, exitCode } = await runCommand(ls, [], { tree })
        expect(stdoutText()).toBe('posts/\nbio.md\n')
        expect(exitCode).toBe(0)
    })

    test('lists a relative path', async () => {
        const { stdoutText } = await runCommand(ls, ['posts'], { tree })
        expect(stdoutText()).toBe('post-1.md\npost-2.md\n')
    })

    test('resolves paths against the cwd', async () => {
        const { stdoutText } = await runCommand(ls, ['..'], { tree, cwd: `${HOME}/posts` })
        expect(stdoutText()).toBe('posts/\nbio.md\n')
    })

    test('-a prepends . and ..', async () => {
        const { stdoutText } = await runCommand(ls, ['-a', 'posts'], { tree })
        expect(stdoutText()).toBe('./\n../\npost-1.md\npost-2.md\n')
    })

    test('--all behaves like -a', async () => {
        const { stdoutText } = await runCommand(ls, ['--all'], { tree })
        expect(stdoutText().startsWith('./\n../\n')).toBe(true)
    })

    test('-l prints type size date name columns', async () => {
        const { stdoutText } = await runCommand(ls, ['-l'], { tree })
        expect(stdoutText()).toBe('d    - -          posts/\n- 2.0K 2026-01-02 bio.md\n')
    })

    test('-la combines both flags', async () => {
        const { stdoutText } = await runCommand(ls, ['-la', 'posts'], { tree })
        expect(stdoutText().split('\n')).toEqual([
            'd    - -          ./',
            'd    - -          ../',
            '- 1.2K 2026-10-24 post-1.md',
            '-  340 -          post-2.md',
            '',
        ])
    })

    test('prints the name of a file path as typed', async () => {
        const { stdoutText } = await runCommand(ls, ['./bio.md'], { tree })
        expect(stdoutText()).toBe('./bio.md\n')
    })

    test('prints headers and blank lines for several paths', async () => {
        const { stdoutText } = await runCommand(ls, ['posts', '~'], { tree })
        expect(stdoutText()).toBe('posts:\npost-1.md\npost-2.md\n\n~:\nposts/\nbio.md\n')
    })

    test('reports a missing path, continues and exits 1', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(ls, ['nope', 'posts'], { tree })
        expect(stderrText()).toBe("ls: cannot access 'nope': No such file or directory\n")
        expect(stdoutText()).toBe('posts:\npost-1.md\npost-2.md\n')
        expect(exitCode).toBe(1)
    })

    test('rejects unknown flags', async () => {
        const { stderrText, exitCode } = await runCommand(ls, ['-z'], { tree })
        expect(stderrText()).toBe("ls: invalid option -- 'z'\n")
        expect(exitCode).toBe(2)
    })

    test('stops listing when aborted', async () => {
        const controller = new AbortController()
        controller.abort()
        const { stdoutText } = await runCommand(ls, ['posts', '~'], { tree, signal: controller.signal })
        expect(stdoutText()).toBe('')
    })
})

describe('humanSize', () => {
    test('keeps bytes below 1K as plain numbers', () => {
        expect(humanSize(0)).toBe('0')
        expect(humanSize(340)).toBe('340')
        expect(humanSize(1023)).toBe('1023')
    })

    test('uses one decimal below ten units', () => {
        expect(humanSize(1234)).toBe('1.2K')
        expect(humanSize(5 * 1024 * 1024)).toBe('5.0M')
    })

    test('rounds to whole units from ten upwards', () => {
        expect(humanSize(12 * 1024)).toBe('12K')
    })

    test('returns - when unknown', () => {
        expect(humanSize(undefined)).toBe('-')
    })
})

describe('shortDate', () => {
    test('formats ISO timestamps as YYYY-MM-DD', () => {
        expect(shortDate('2026-10-24T12:00:00.000Z')).toBe('2026-10-24')
    })

    test('returns - for missing or invalid dates', () => {
        expect(shortDate(undefined)).toBe('-')
        expect(shortDate('not a date')).toBe('-')
    })
})
