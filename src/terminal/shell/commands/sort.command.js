import { splitFlags } from '../splitFlags'
import { defineCommand } from '../defineCommand'
import { concatLines } from './concatLines'
import { readInputs } from './readInputs'
import { reportUnsupportedFlag } from './reportUnsupportedFlag'
import { reportUsageError } from './reportUsageError'
import { writeLines } from './writeLines'

/** @typedef {import('../types').Ctx} Ctx */
/** @typedef {import('./types').CompareLines} CompareLines */

const USAGE = 'sort [-r] [-n] [-u]'

/** @type {CompareLines} */
const compareCodePoints = (a, b) => {
    if (a < b) return -1
    return a > b ? 1 : 0
}

/**
 * @param {string} line
 * @returns {number}
 */
const parseLeadingNumber = (line) => {
    const value = parseFloat(line)
    return Number.isNaN(value) ? 0 : value
}

/** @type {CompareLines} */
const compareLeadingNumbers = (a, b) => parseLeadingNumber(a) - parseLeadingNumber(b) || compareCodePoints(a, b)

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
    if (inputs.length === 0 && !failed) return reportUsageError(ctx, USAGE)

    const lines = concatLines(ctx, inputs)
    const compare = flags.has('n') ? compareLeadingNumbers : compareCodePoints
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
