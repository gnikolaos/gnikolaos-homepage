import { describe, expect, test } from 'vitest'
import { stripAnsi } from '../ansi'
import { defineCommand } from '../registry'
import man, { manPage } from './man'
import { runCommand } from './testUtils'

const noop = () => {}
const ls = defineCommand({ name: 'ls', summary: 'list directory contents', usage: 'ls [-al] [path...]', run: noop })
const secret = defineCommand({ name: 'secret', summary: 'hidden thing', usage: 'secret', hidden: true, run: noop })
const commands = [man, ls, secret]

const LS_PAGE = 'NAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [-al] [path...]\n'

describe('manPage', () => {
    test('builds NAME and SYNOPSIS sections with bold headers', () => {
        expect(manPage(ls)).toBe(
            '\x1b[1mNAME\x1b[0m\n       ls - list directory contents\n\n\x1b[1mSYNOPSIS\x1b[0m\n       ls [-al] [path...]\n',
        )
    })
})

describe('man', () => {
    test('prints the page of a command', async () => {
        const { stdoutText, exitCode } = await runCommand(man, ['ls'], { commands })
        expect(stripAnsi(stdoutText())).toBe(LS_PAGE)
        expect(exitCode).toBe(0)
    })

    test('has pages for hidden commands', async () => {
        const { stdoutText } = await runCommand(man, ['secret'], { commands })
        expect(stripAnsi(stdoutText())).toBe('NAME\n       secret - hidden thing\n\nSYNOPSIS\n       secret\n')
    })

    test('asks for a page without arguments', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(man, [], { commands })
        expect(stderrText()).toBe('What manual page do you want?\n')
        expect(stdoutText()).toBe('')
        expect(exitCode).toBe(1)
    })

    test('reports an unknown command', async () => {
        const { stderrText, exitCode } = await runCommand(man, ['nope'], { commands })
        expect(stderrText()).toBe('man: no manual entry for nope\n')
        expect(exitCode).toBe(1)
    })

    test('separates several pages with a blank line', async () => {
        const { stdoutText, exitCode } = await runCommand(man, ['ls', 'man'], { commands })
        expect(stripAnsi(stdoutText())).toBe(
            `${LS_PAGE}\nNAME\n       man - show the manual for a command\n\nSYNOPSIS\n       man <command>\n`,
        )
        expect(exitCode).toBe(0)
    })

    test('prints the pages it finds and exits 1 if any is missing', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(man, ['nope', 'ls'], { commands })
        expect(stderrText()).toBe('man: no manual entry for nope\n')
        expect(stripAnsi(stdoutText())).toBe(LS_PAGE)
        expect(exitCode).toBe(1)
    })

    test('completes command names', () => {
        expect(man.complete).toBe('commands')
    })
})
