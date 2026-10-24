import { describe, expect, test } from 'vitest'
import clear from './clear'
import { runCommand } from '@test/runCommand'

describe('clear', () => {
    test('clears the screen', async () => {
        const { recorded, exitCode } = await runCommand(clear, [])
        expect(recorded.clears).toBe(1)
        expect(exitCode).toBe(0)
    })
})
