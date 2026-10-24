import { splitFlags } from '../splitFlags'
import { defineCommand } from '../defineCommand'
import { concatLines, readInputs, reportUnsupportedFlag, usageError, writeLines } from './textInput'

/** @typedef {import('../types').Ctx} Ctx */
/** @typedef {{ line: string, count: number }} LineRun */

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
    if (inputs.length === 0 && !failed) return usageError(ctx, USAGE)

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
