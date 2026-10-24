import { splitFlags } from '../splitFlags'
import { readInputs } from './readInputs'
import { reportUnsupportedFlag } from './reportUnsupportedFlag'
import { reportUsageError } from './reportUsageError'
import { splitLines } from './splitLines'
import { writeLines } from './writeLines'

/** @typedef {import('../types').Ctx} Ctx */
/** @typedef {import('./types').LineCount} LineCount */
/** @typedef {import('./types').LinePicker} LinePicker */

const DEFAULT_LINE_COUNT = 10
const DIGITS = /^\d+$/

/**
 * @param {string[]} argv
 * @param {string} name
 * @returns {LineCount}
 */
const parseLineCount = (argv, name) => {
    let count = DEFAULT_LINE_COUNT
    /** @type {string[]} */
    const rest = []
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i]
        let value
        if (arg === '--') {
            rest.push(...argv.slice(i))
            break
        } else if (/^-\d+$/.test(arg)) {
            value = arg.slice(1)
        } else if (arg === '-n') {
            if (i + 1 >= argv.length) return { count, rest, error: `${name}: option requires an argument -- 'n'` }
            i += 1
            value = argv[i]
        } else if (arg.startsWith('-n')) {
            value = arg.slice(2)
        } else {
            rest.push(arg)
            continue
        }
        if (!DIGITS.test(value)) return { count, rest, error: `${name}: invalid number of lines: '${value}'` }
        count = Number(value)
    }
    return { count, rest, error: null }
}

/**
 * Runs the shared body of head and tail: reads `-n N`, `-nN` or `-N` and prints the lines `pick` chooses per input.
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 * @param {LinePicker} picker
 * @returns {Promise<number>}
 */
const runLinePicker = async (ctx, argv, stdin, { name, usage, pick }) => {
    const { count, rest, error } = parseLineCount(argv, name)
    if (error !== null) {
        ctx.stderr(`${error}\n`)
        return 2
    }
    const { flags, positionals: files } = splitFlags(rest)
    if (reportUnsupportedFlag(ctx, name, flags, '')) return 2
    const { inputs, failed } = await readInputs(ctx, name, files, stdin)
    if (inputs.length === 0 && !failed) return reportUsageError(ctx, usage)

    const withHeaders = files.length > 1
    for (const [index, input] of inputs.entries()) {
        if (ctx.signal.aborted) break
        if (withHeaders) ctx.stdout(`${index > 0 ? '\n' : ''}==> ${input.label} <==\n`)
        writeLines(ctx, pick(splitLines(input.text), count))
    }
    return failed ? 1 : 0
}

export { runLinePicker }
