import { style } from '../style'
import { defineCommand } from '../defineCommand'

/** @typedef {import('../types').Command} Command */

const INDENT = ' '.repeat(7)

/**
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
const section = (title, body) => `${style(title, 'bold')}\n${INDENT}${body}\n`

/**
 * @param {Command} command
 * @returns {string}
 */
const manPage = (command) =>
    `${section('NAME', `${command.name} - ${command.summary}`)}\n${section('SYNOPSIS', command.usage)}`

export { manPage }

export default defineCommand({
    name: 'man',
    summary: 'show the manual for a command',
    usage: 'man <command>',
    complete: 'commands',
    run: (ctx, argv) => {
        if (argv.length === 0) {
            ctx.stderr('What manual page do you want?\n')
            return 1
        }
        let failed = false
        let printedPage = false
        for (const name of argv) {
            const command = ctx.registry.get(name)
            if (!command) {
                ctx.stderr(`man: no manual entry for ${name}\n`)
                failed = true
                continue
            }
            if (printedPage) ctx.stdout('\n')
            ctx.stdout(manPage(command))
            printedPage = true
        }
        return failed ? 1 : 0
    },
})
