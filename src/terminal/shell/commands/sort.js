import { splitFlags } from '../splitFlags'
import { defineCommand } from '../defineCommand'
import { concatLines, readInputs, reportUnsupportedFlag, usageError, writeLines } from './textInput'

/** @typedef {import('../types').Ctx} Ctx */
/** @typedef {(a: string, b: string) => number} Compare */

const USAGE = 'sort [-r] [-n] [-u]'

/** @type {Compare} */
const byCodePoint = (a, b) => {
    if (a < b) return -1
    return a > b ? 1 : 0
}

/**
 * @param {string} line
 * @returns {number}
 */
const leadingNumber = (line) => {
    const value = parseFloat(line)
    return Number.isNaN(value) ? 0 : value
}

/** @type {Compare} */
const byLeadingNumber = (a, b) => leadingNumber(a) - leadingNumber(b) || byCodePoint(a, b)

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
const dropAdjacentDuplicates = (lines) => lines.filter((line, index) => index === 0 || line !== lines[index - 1])

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 */
const run = async (ctx, argv, stdin) => {
    const { flags, positionals: files } = splitFlags(argv)
    if (reportUnsupportedFlag(ctx, 'sort', flags, 'rnu')) return 2
    const { inputs, failed } = await readInputs(ctx, 'sort', files, stdin)
    if (inputs.length === 0 && !failed) return usageError(ctx, USAGE)

    const lines = concatLines(ctx, inputs)
    const compare = flags.has('n') ? byLeadingNumber : byCodePoint
    const sorted = lines.sort(flags.has('r') ? (a, b) => compare(b, a) : compare)
    writeLines(ctx, flags.has('u') ? dropAdjacentDuplicates(sorted) : sorted)
    return failed ? 1 : 0
}

export default defineCommand({
    name: 'sort',
    summary: 'sort lines of text',
    usage: USAGE,
    run,
})
