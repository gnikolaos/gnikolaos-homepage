import { describe, expect, test } from 'vitest'
import logout from './logout.command'
import { runCommand } from '@test/runCommand'

describe('logout', () => {
    test('closes the connection and navigates home', async () => {
        const { stdoutText, recorded } = await runCommand(logout, [])
        expect(logout.name).toBe('logout')
        expect(stdoutText()).toBe('Connection to gnikolaos.gr closed.\n')
        expect(recorded.navigations).toEqual(['/'])
    })
})
