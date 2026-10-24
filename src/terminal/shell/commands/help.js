import { defineCommand } from '../defineCommand'
import { splitFlags } from '../splitFlags'

/** @typedef {import('../types').Command} Command */

/**
 * @param {Command[]} commands
 * @returns {string[]}
 */
const alignedLines = (commands) => {
    const width = Math.max(0, ...commands.map((command) => command.name.length))
    return commands.map((command) => `${command.name.padEnd(width)}  ${command.summary}`)
}

export default defineCommand({
    name: 'help',
    summary: 'list available commands',
    usage: 'help [--all]',
    complete: 'none',
    run: (ctx, argv) => {
        const includeHidden = splitFlags(argv).flags.has('all')
        ctx.stdout('Available commands:\n')
        for (const line of alignedLines(ctx.registry.list({ includeHidden }))) ctx.stdout(`${line}\n`)
    },
})
