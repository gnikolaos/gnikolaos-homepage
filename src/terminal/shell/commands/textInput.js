import { isFsError } from '../../fs/isFsError'
import { splitFlags } from '../flags'

/** @typedef {import('../registry').Ctx} Ctx */
/** @typedef {{ label: string | null, text: string }} TextInput */
/** @typedef {{ count: number, rest: string[], error: string | null }} LineCount */

const DEFAULT_LINE_COUNT = 10
const DIGITS = /^\d+$/

/**
 * @param {Ctx} ctx
 * @param {string} name
 * @param {string[]} files
 * @param {string | null} stdin
 * @returns {Promise<{ inputs: TextInput[], failed: boolean }>}
 */
const readInputs = async (ctx, name, files, stdin) => {
    if (files.length === 0) return { inputs: stdin === null ? [] : [{ label: null, text: stdin }], failed: false }
    /** @type {TextInput[]} */
    const inputs = []
    let failed = false
    for (const file of files) {
        if (ctx.signal.aborted) break
        try {
            inputs.push({ label: file, text: await ctx.fs.readFile(ctx.fs.resolve(ctx.cwd, file)) })
        } catch (error) {
            if (!isFsError(error)) throw error
            ctx.stderr(`${name}: ${file}: ${error.description}\n`)
            failed = true
        }
    }
    return { inputs, failed }
}

/**
 * @param {string} text
 * @returns {string[]}
 */
const splitLines = (text) => {
    if (text === '') return []
    const lines = text.split('\n')
    if (text.endsWith('\n')) lines.pop()
    return lines
}

/**
 * @param {Ctx} ctx
 * @param {TextInput[]} inputs
 * @returns {string[]}
 */
const concatLines = (ctx, inputs) => {
    /** @type {string[]} */
    const lines = []
    for (const input of inputs) {
        if (ctx.signal.aborted) break
        lines.push(...splitLines(input.text))
    }
    return lines
}

/**
 * @param {Ctx} ctx
 * @param {string[]} lines
 */
const writeLines = (ctx, lines) => {
    if (lines.length > 0) ctx.stdout(lines.map((line) => `${line}\n`).join(''))
}

/**
 * Reads `-n N`, `-nN` and `-N` out of argv and returns the remaining arguments.
 *
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
 * Prints `<name>: invalid option -- 'x'` for the first flag outside `supported`.
 *
 * @param {Ctx} ctx
 * @param {string} name
 * @param {Set<string>} flags
 * @param {string} supported   the accepted single-letter flags, e.g. 'inv'
 * @returns {boolean} whether an unsupported flag was reported
 */
const reportUnsupportedFlag = (ctx, name, flags, supported) => {
    const isSupported = (/** @type {string} */ flag) => flag.length === 1 && supported.includes(flag)
    const unsupported = [...flags].find((flag) => !isSupported(flag))
    if (unsupported === undefined) return false
    ctx.stderr(`${name}: invalid option -- '${unsupported}'\n`)
    return true
}

/**
 * @param {Ctx} ctx
 * @param {string} usage
 * @returns {number}
 */
const usageError = (ctx, usage) => {
    ctx.stderr(`usage: ${usage}\n`)
    return 2
}

/**
 * Shared body of head and tail: `pick` chooses the lines of each input.
 *
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 * @param {{ name: string, usage: string, pick: (lines: string[], count: number) => string[] }} command
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
    if (inputs.length === 0 && !failed) return usageError(ctx, usage)

    const withHeaders = files.length > 1
    for (const [index, input] of inputs.entries()) {
        if (ctx.signal.aborted) break
        if (withHeaders) ctx.stdout(`${index > 0 ? '\n' : ''}==> ${input.label} <==\n`)
        writeLines(ctx, pick(splitLines(input.text), count))
    }
    return failed ? 1 : 0
}

export {
    readInputs,
    splitLines,
    concatLines,
    writeLines,
    parseLineCount,
    reportUnsupportedFlag,
    usageError,
    runLinePicker,
}
