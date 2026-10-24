import { describe, expect, test } from 'vitest'
import exit, { logout } from './exit'
import { runCommand } from '@test/runCommand'

describe('exit', () => {
    test.each([
        ['exit', exit],
        ['logout', logout],
    ])('%s closes the connection and navigates home', async (name, command) => {
        const { stdoutText, recorded } = await runCommand(command, [])
        expect(command.name).toBe(name)
        expect(stdoutText()).toBe('Connection to gnikolaos.gr closed.\n')
        expect(recorded.navigations).toEqual(['/'])
    })
})
