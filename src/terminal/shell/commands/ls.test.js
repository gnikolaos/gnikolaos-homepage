import { describe, expect, test } from 'vitest'
import { stripAnsi } from '../stripAnsi'
import ls, { formatLong, humanSize } from './ls'
import { HOME } from '@test/HOME'
import { createFakeFile } from '@test/createFakeFile'
import { runCommand } from '@test/runCommand'

const tree = {
    posts: {
        'post-1.md': createFakeFile('# Hi', { size: 1234, mtime: '2025-03-05T08:30:00.000Z' }),
        'post-2.md': createFakeFile('# Two', { size: 340 }),
    },
    'bio.md': createFakeFile('# Bio', { size: 2048, mtime: '2026-01-02T00:00:00.000Z' }),
    'notes.txt': createFakeFile('plain', { size: 5, mtime: '2024-12-31T23:59:00.000Z' }),
}

/**
 * @param {Parameters<typeof runCommand>[1]} argv
 * @param {Parameters<typeof runCommand>[2]} [options]
 */
const plainLs = async (argv, options = {}) => {
    const result = await runCommand(ls, argv, { tree, ...options })
    return { ...result, plain: stripAnsi(result.stdoutText()) }
}

describe('ls', () => {
    test('lists the cwd with dirs ending in a slash', async () => {
        const { plain, exitCode } = await plainLs([])
        expect(plain).toBe('posts/\nbio.md\nnotes.txt\n')
        expect(exitCode).toBe(0)
    })

    test('colors dirs bold blue, markdown green and other files plain', async () => {
        const { stdoutText } = await runCommand(ls, [], { tree })
        expect(stdoutText()).toBe('\x1b[1;34mposts/\x1b[0m\n\x1b[32mbio.md\x1b[0m\nnotes.txt\n')
    })

    test('lists a relative path', async () => {
        const { plain } = await plainLs(['posts'])
        expect(plain).toBe('post-1.md\npost-2.md\n')
    })

    test('resolves paths against the cwd', async () => {
        const { plain } = await plainLs(['..'], { cwd: `${HOME}/posts` })
        expect(plain).toBe('posts/\nbio.md\nnotes.txt\n')
    })

    test('-a prepends . and .. as directories', async () => {
        const { stdoutText } = await runCommand(ls, ['-a', 'posts'], { tree })
        expect(stdoutText().split('\n').slice(0, 2)).toEqual(['\x1b[1;34m./\x1b[0m', '\x1b[1;34m../\x1b[0m'])
        expect(stripAnsi(stdoutText())).toBe('./\n../\npost-1.md\npost-2.md\n')
    })

    test('--all behaves like -a', async () => {
        const { plain } = await plainLs(['--all'])
        expect(plain.startsWith('./\n../\n')).toBe(true)
    })

    test('-l prints coreutils columns', async () => {
        const { plain } = await plainLs(['-l'])
        expect(plain.split('\n')).toEqual([
            'drwxr-xr-x 2 visitor visitor    - -            posts',
            '-rw-r--r-- 1 visitor visitor 2.0K Jan  2  2026 bio.md',
            '-rw-r--r-- 1 visitor visitor    5 Dec 31  2024 notes.txt',
            '',
        ])
    })

    test('-l colors names without a trailing slash', async () => {
        const { stdoutText } = await runCommand(ls, ['-l'], { tree })
        expect(stdoutText().split('\n')[0].endsWith(' \x1b[1;34mposts\x1b[0m')).toBe(true)
    })

    test('-la combines both flags', async () => {
        const { plain } = await plainLs(['-la', 'posts'])
        expect(plain.split('\n')).toEqual([
            'drwxr-xr-x 2 visitor visitor    - -            .',
            'drwxr-xr-x 2 visitor visitor    - -            ..',
            '-rw-r--r-- 1 visitor visitor 1.2K Mar  5  2025 post-1.md',
            '-rw-r--r-- 1 visitor visitor  340 -            post-2.md',
            '',
        ])
    })

    test('prints the name of a file path as typed', async () => {
        const { plain } = await plainLs(['./bio.md'])
        expect(plain).toBe('./bio.md\n')
    })

    test('prints headers and blank lines for several paths', async () => {
        const { plain } = await plainLs(['posts', '~'])
        expect(plain).toBe('posts:\npost-1.md\npost-2.md\n\n~:\nposts/\nbio.md\nnotes.txt\n')
    })

    test('reports a missing path, continues and exits 1', async () => {
        const { plain, stderrText, exitCode } = await plainLs(['nope', 'posts'])
        expect(stderrText()).toBe("ls: cannot access 'nope': No such file or directory\n")
        expect(plain).toBe('posts:\npost-1.md\npost-2.md\n')
        expect(exitCode).toBe(1)
    })

    test('rejects unknown flags', async () => {
        const { stderrText, exitCode } = await plainLs(['-z'])
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

describe('formatLong', () => {
    const now = new Date('2026-10-24T13:00:00.000Z')

    /**
     * @param {string} [mtime]
     * @returns {string}
     */
    const fileLine = (mtime) => stripAnsi(formatLong([{ name: 'a.md', type: 'file', size: 1, mtime }], { now })[0])

    test('shows the time for files modified within six months', () => {
        expect(fileLine('2026-10-24T12:00:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 Oct 24 12:00 a.md')
        expect(fileLine('2026-05-01T09:05:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 May  1 09:05 a.md')
    })

    test('shows the year for older or future files', () => {
        expect(fileLine('2025-10-24T12:00:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 Oct 24  2025 a.md')
        expect(fileLine('2026-04-24T12:00:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 Apr 24  2026 a.md')
        expect(fileLine('2027-01-01T00:00:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 Jan  1  2027 a.md')
    })

    test('formats in UTC', () => {
        expect(fileLine('2026-10-23T23:30:00.000Z')).toBe('-rw-r--r-- 1 visitor visitor 1 Oct 23 23:30 a.md')
    })

    test('prints - for missing or invalid dates', () => {
        expect(fileLine(undefined)).toBe('-rw-r--r-- 1 visitor visitor 1 - a.md')
        expect(fileLine('not a date')).toBe('-rw-r--r-- 1 visitor visitor 1 - a.md')
    })

    test('aligns links and size right and date left', () => {
        const lines = formatLong(
            [
                { name: 'posts', type: 'dir' },
                { name: 'big.md', type: 'file', size: 12 * 1024, mtime: '2026-10-24T12:00:00.000Z' },
            ],
            { now },
        ).map(stripAnsi)
        expect(lines).toEqual([
            'drwxr-xr-x 2 visitor visitor   - -            posts',
            '-rw-r--r-- 1 visitor visitor 12K Oct 24 12:00 big.md',
        ])
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
