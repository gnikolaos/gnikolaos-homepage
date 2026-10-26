import { defineCommand } from '../defineCommand'
import { splitFlags } from '../splitFlags'

/** @import { Command } from '../types' */

/**
 * @param {Command[]} commands
 * @returns {string[]}
 */
const alignLines = (commands) => {
    const width = Math.max(0, ...commands.map((command) => command.name.length))
    return commands.map((command) => `${command.name.padEnd(width)}  ${command.summary}`)
}

export default defineCommand({
    name: 'help',
    summary: 'list available commands',
    usage: 'help [-a|--all]',
    complete: 'none',
    run: (ctx, argv) => {
        const { flags } = splitFlags(argv)
        const includeHidden = flags.has('a') || flags.has('all')
        ctx.stdout('Available commands:\n')
        for (const line of alignLines(ctx.registry.list({ includeHidden }))) ctx.stdout(`${line}\n`)
        if (!includeHidden) ctx.stdout("\nType 'help -a' to see all commands.\n")
    },
})
