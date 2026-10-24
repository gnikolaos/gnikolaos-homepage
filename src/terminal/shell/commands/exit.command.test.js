import { describe, expect, test } from 'vitest'
import exit from './exit.command'
import { runCommand } from '@test/runCommand'

describe('exit', () => {
    test('closes the connection and navigates home', async () => {
        const { stdoutText, recorded } = await runCommand(exit, [])
        expect(exit.name).toBe('exit')
        expect(stdoutText()).toBe('Connection to gnikolaos.gr closed.\n')
        expect(recorded.navigations).toEqual(['/'])
    })
})
