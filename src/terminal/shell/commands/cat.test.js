import { describe, expect, test } from 'vitest'
import cat from './cat'
import { file, runCommand } from './testUtils'

const tree = {
    posts: { 'post-1.md': '# Hi', 'broken.md': file('', { failRead: true }) },
    'bio.md': '# Bio',
    'notes.txt': 'plain',
}

describe('cat', () => {
    test('renders a markdown file through ctx.markdown', async () => {
        const { recorded, exitCode } = await runCommand(cat, ['bio.md'], { tree })
        expect(recorded.markdown).toEqual(['# Bio'])
        expect(recorded.stdout).toEqual([])
        expect(exitCode).toBe(0)
    })

    test('prints other files to stdout with a trailing newline', async () => {
        const { stdoutText } = await runCommand(cat, ['notes.txt'], { tree })
        expect(stdoutText()).toBe('plain\n')
    })

    test('separates several files with a blank line', async () => {
        const { recorded } = await runCommand(cat, ['bio.md', 'posts/post-1.md'], { tree })
        expect(recorded.markdown).toEqual(['# Bio', '# Hi'])
        expect(recorded.stdout).toEqual(['\n'])
    })

    test('reports a missing file and keeps going', async () => {
        const { recorded, stderrText, exitCode } = await runCommand(cat, ['x', 'bio.md'], { tree })
        expect(stderrText()).toBe('cat: x: No such file or directory\n')
        expect(recorded.markdown).toEqual(['# Bio'])
        expect(exitCode).toBe(1)
    })

    test('reports a directory', async () => {
        const { stderrText, exitCode } = await runCommand(cat, ['posts'], { tree })
        expect(stderrText()).toBe('cat: posts: Is a directory\n')
        expect(exitCode).toBe(1)
    })

    test('reports a failed fetch', async () => {
        const { stderrText } = await runCommand(cat, ['posts/broken.md'], { tree })
        expect(stderrText()).toBe('cat: posts/broken.md: Input/output error\n')
    })

    test('prints stdin when called without files', async () => {
        const { stdoutText, exitCode } = await runCommand(cat, [], { tree, stdin: 'piped\n' })
        expect(stdoutText()).toBe('piped\n')
        expect(exitCode).toBe(0)
    })

    test('prints usage without files or stdin', async () => {
        const { stderrText, exitCode } = await runCommand(cat, [], { tree })
        expect(stderrText()).toBe('usage: cat file...\n')
        expect(exitCode).toBe(1)
    })
})
