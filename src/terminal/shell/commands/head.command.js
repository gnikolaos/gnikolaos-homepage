import { defineCommand } from '../defineCommand'
import { runLinePicker } from './runLinePicker'

const USAGE = 'head [-n N] [file...]'

/**
 * @param {string[]} lines
 * @param {number} count
 * @returns {string[]}
 */
const pickFirstLines = (lines, count) => lines.slice(0, count)

export default defineCommand({
    name: 'head',
    summary: 'print the first lines of files',
    usage: USAGE,
    hidden: true,
    run: (ctx, argv, stdin) => runLinePicker(ctx, argv, stdin, { name: 'head', usage: USAGE, pick: pickFirstLines }),
})
