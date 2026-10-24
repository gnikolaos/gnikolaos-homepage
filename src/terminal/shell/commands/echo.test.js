import { describe, expect, test } from 'vitest'
import echo from './echo'
import { runCommand } from './testUtils'

describe('echo', () => {
    test('joins arguments with one space', async () => {
        const { stdoutText } = await runCommand(echo, ['hello', 'big  world'])
        expect(stdoutText()).toBe('hello big  world\n')
    })

    test('prints an empty line without arguments', async () => {
        const { stdoutText } = await runCommand(echo, [])
        expect(stdoutText()).toBe('\n')
    })

    test('-n omits the trailing newline', async () => {
        const { stdoutText } = await runCommand(echo, ['-n', 'hi'])
        expect(stdoutText()).toBe('hi')
    })
})
