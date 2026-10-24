import { defineCommand } from '../registry'

/**
 * @param {string} line
 * @param {number} index
 * @returns {string}
 */
const numbered = (line, index) => `${String(index + 1).padStart(5)}  ${line}\n`

export default defineCommand({
    name: 'history',
    summary: 'show command history',
    usage: 'history',
    complete: 'none',
    run: (ctx) => {
        ctx.history.forEach((line, index) => ctx.stdout(numbered(line, index)))
    },
})
