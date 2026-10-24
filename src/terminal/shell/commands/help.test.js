import { describe, expect, test } from 'vitest'
import { defineCommand } from '../registry'
import help from './help'
import { runCommand } from './testUtils'

const noop = () => {}
const commands = [
    help,
    defineCommand({ name: 'ls', summary: 'list', usage: 'ls', run: noop }),
    defineCommand({ name: 'secret', summary: 'hidden thing', usage: 'secret', hidden: true, run: noop }),
]

describe('help', () => {
    test('lists visible commands aligned to the longest name', async () => {
        const { stdoutText, exitCode } = await runCommand(help, [], { commands })
        expect(stdoutText()).toBe('Available commands:\nhelp  list available commands\nls    list\n')
        expect(exitCode).toBe(0)
    })

    test('--all includes hidden commands', async () => {
        const { stdoutText } = await runCommand(help, ['--all'], { commands })
        expect(stdoutText()).toBe(
            'Available commands:\nhelp    list available commands\nls      list\nsecret  hidden thing\n',
        )
    })
})
