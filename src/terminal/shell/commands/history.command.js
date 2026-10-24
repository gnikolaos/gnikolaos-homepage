import { defineCommand } from '../defineCommand'

/**
 * @param {string} line
 * @param {number} index
 * @returns {string}
 */
const numberLine = (line, index) => `${String(index + 1).padStart(5)}  ${line}\n`

export default defineCommand({
    name: 'history',
    summary: 'show command history',
    usage: 'history',
    complete: 'none',
    run: (ctx) => {
        ctx.history.forEach((line, index) => ctx.stdout(numberLine(line, index)))
    },
})
