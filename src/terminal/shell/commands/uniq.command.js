import { splitFlags } from '../splitFlags'
import { defineCommand } from '../defineCommand'
import { concatLines } from './concatLines'
import { readInputs } from './readInputs'
import { reportUnsupportedFlag } from './reportUnsupportedFlag'
import { reportUsageError } from './reportUsageError'
import { writeLines } from './writeLines'

/** @import { Ctx } from '../types' */
/** @import { LineRun } from './types' */

const USAGE = 'uniq [-c]'

/**
 * @param {string[]} lines
 * @returns {LineRun[]}
 */
const collapseRuns = (lines) => {
    /** @type {LineRun[]} */
    const runs = []
    for (const line of lines) {
        const last = runs.at(-1)
        if (last?.line === line) last.count += 1
        else runs.push({ line, count: 1 })
    }
    return runs
}

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 */
const run = async (ctx, argv, stdin) => {
    const { flags, positionals: files } = splitFlags(argv)
    if (reportUnsupportedFlag(ctx, 'uniq', flags, 'c')) return 2
    const { inputs, failed } = await readInputs(ctx, 'uniq', files, stdin)
    if (inputs.length === 0 && !failed) return reportUsageError(ctx, USAGE)

    const lines = concatLines(ctx, inputs)
    const runs = collapseRuns(lines)
    writeLines(
        ctx,
        runs.map(({ line, count }) => (flags.has('c') ? `${String(count).padStart(7)} ${line}` : line)),
    )
    return failed ? 1 : 0
}

export default defineCommand({
    name: 'uniq',
    summary: 'collapse adjacent duplicate lines',
    usage: USAGE,
    run,
})
