import { describe, expect, test } from 'vitest'
import home from './home.command'
import { runCommand } from '@test/runCommand'

describe('home', () => {
    test('navigates to the homepage', async () => {
        const { recorded, stdoutText } = await runCommand(home, [])
        expect(recorded.navigations).toEqual(['/'])
        expect(stdoutText()).toBe('')
    })
})
