import { describe, expect, test } from 'vitest'
import profile from '../../profile'
import open from './open'
import { runCommand } from './testUtils'

describe('open', () => {
    test.each(['github', 'linkedin', 'email'])('resolves the %s alias from the profile', async (alias) => {
        const { stdoutText, recorded, exitCode } = await runCommand(open, [alias])
        expect(recorded.opened).toEqual([profile.links[alias]])
        expect(stdoutText()).toBe(`Opening ${profile.links[alias]}\n`)
        expect(exitCode).toBe(0)
    })

    test.each(['https://example.com', 'http://example.com', 'mailto:a@b.c'])('opens %s', async (url) => {
        const { recorded } = await runCommand(open, [url])
        expect(recorded.opened).toEqual([url])
    })

    test('rejects unknown targets', async () => {
        const { stderrText, recorded, exitCode } = await runCommand(open, ['javascript:alert(1)'])
        expect(stderrText()).toBe('open: unknown target: javascript:alert(1)\n')
        expect(recorded.opened).toEqual([])
        expect(exitCode).toBe(1)
    })

    test('prints usage without a target', async () => {
        const { stderrText, exitCode } = await runCommand(open, [])
        expect(stderrText()).toBe('usage: open <github|linkedin|email|url>\n')
        expect(exitCode).toBe(1)
    })
})
