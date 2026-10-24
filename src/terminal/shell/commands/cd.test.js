import { describe, expect, test } from 'vitest'
import cd from './cd'
import { HOME } from '@test/HOME'
import { runCommand } from '@test/runCommand'

const tree = { posts: { drafts: {}, 'post-1.md': '# Hi' }, 'bio.md': '# Bio' }

describe('cd', () => {
    test('goes home without an argument', async () => {
        const { ctx, exitCode } = await runCommand(cd, [], { tree, cwd: '/' })
        expect(ctx.cwd).toBe(HOME)
        expect(exitCode).toBe(0)
    })

    test('changes into a relative directory', async () => {
        const { ctx } = await runCommand(cd, ['posts/drafts'], { tree })
        expect(ctx.cwd).toBe(`${HOME}/posts/drafts`)
    })

    test('handles .. and ~', async () => {
        expect((await runCommand(cd, ['..'], { tree })).ctx.cwd).toBe('/home')
        expect((await runCommand(cd, ['~/posts'], { tree, cwd: '/' })).ctx.cwd).toBe(`${HOME}/posts`)
    })

    test('reports a missing directory with the typed argument', async () => {
        const { ctx, stderrText, exitCode } = await runCommand(cd, ['nope'], { tree })
        expect(stderrText()).toBe('cd: no such file or directory: nope\n')
        expect(exitCode).toBe(1)
        expect(ctx.cwd).toBe(HOME)
    })

    test('refuses to enter a file', async () => {
        const { stderrText, exitCode, recorded } = await runCommand(cd, ['bio.md'], { tree })
        expect(stderrText()).toBe('cd: not a directory: bio.md\n')
        expect(exitCode).toBe(1)
        expect(recorded.cwdChanges).toEqual([])
    })

    test('rejects more than one argument', async () => {
        const { stderrText, exitCode } = await runCommand(cd, ['a', 'b'], { tree })
        expect(stderrText()).toBe('cd: too many arguments\n')
        expect(exitCode).toBe(1)
    })
})
