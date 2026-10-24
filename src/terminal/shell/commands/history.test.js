import { describe, expect, test } from 'vitest'
import history from './history'
import { runCommand } from '@test/runCommand'

describe('history', () => {
    test('numbers entries zsh style from 1', async () => {
        const { stdoutText } = await runCommand(history, [], { history: ['ls', 'cat bio.md'] })
        expect(stdoutText()).toBe('    1  ls\n    2  cat bio.md\n')
    })

    test('prints nothing for an empty history', async () => {
        const { stdoutText, exitCode } = await runCommand(history, [])
        expect(stdoutText()).toBe('')
        expect(exitCode).toBe(0)
    })
})
