import { describe, expect, test } from 'vitest'
import { doNothing } from '@test/doNothing'
import { defineCommand } from '../defineCommand'
import help from './help.command'
import { runCommand } from '@test/runCommand'

const commands = [
    help,
    defineCommand({ name: 'ls', summary: 'list', usage: 'ls', run: doNothing }),
    defineCommand({ name: 'secret', summary: 'hidden thing', usage: 'secret', hidden: true, run: doNothing }),
]

describe('help', () => {
    test('lists visible commands aligned to the longest name, then hints at -a', async () => {
        const { stdoutText, exitCode } = await runCommand(help, [], { commands })
        expect(stdoutText()).toBe(
            "Available commands:\nhelp  list available commands\nls    list\n\nType 'help -a' to see all commands.\n",
        )
        expect(exitCode).toBe(0)
    })

    test.each([['-a'], ['--all']])('%s includes hidden commands without the hint', async (flag) => {
        const { stdoutText, exitCode } = await runCommand(help, [flag], { commands })
        expect(stdoutText()).toBe(
            'Available commands:\nhelp    list available commands\nls      list\nsecret  hidden thing\n',
        )
        expect(exitCode).toBe(0)
    })
})
