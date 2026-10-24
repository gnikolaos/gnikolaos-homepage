import { describe, expect, test } from 'vitest'
import home from './home'
import { runCommand } from './testUtils'

describe('home', () => {
    test('navigates to the homepage', async () => {
        const { recorded, stdoutText } = await runCommand(home, [])
        expect(recorded.navigations).toEqual(['/'])
        expect(stdoutText()).toBe('')
    })
})
