import { describe, expect, test } from 'vitest'
import pwd from './pwd.command'
import { HOME } from '@test/HOME'
import { runCommand } from '@test/runCommand'

describe('pwd', () => {
    test('prints the absolute cwd', async () => {
        const { stdoutText, exitCode } = await runCommand(pwd, [], { cwd: `${HOME}/posts` })
        expect(stdoutText()).toBe('/home/guest/posts\n')
        expect(exitCode).toBe(0)
    })
})
