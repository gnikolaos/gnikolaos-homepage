import { defineCommand } from '../defineCommand'
import { runLinePicker } from './textInput'

const USAGE = 'tail [-n N] [file...]'

/**
 * @param {string[]} lines
 * @param {number} count
 * @returns {string[]}
 */
const lastLines = (lines, count) => lines.slice(Math.max(0, lines.length - count))

export default defineCommand({
    name: 'tail',
    summary: 'print the last lines of files',
    usage: USAGE,
    run: (ctx, argv, stdin) => runLinePicker(ctx, argv, stdin, { name: 'tail', usage: USAGE, pick: lastLines }),
})
