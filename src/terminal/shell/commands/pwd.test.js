import { describe, expect, test } from 'vitest'
import pwd from './pwd'
import { HOME, runCommand } from './testUtils'

describe('pwd', () => {
    test('prints the absolute cwd', async () => {
        const { stdoutText, exitCode } = await runCommand(pwd, [], { cwd: `${HOME}/posts` })
        expect(stdoutText()).toBe('/home/visitor/posts\n')
        expect(exitCode).toBe(0)
    })
})
