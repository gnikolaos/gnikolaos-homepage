import { style } from '../ansi'
import { splitFlags } from '../flags'
import { defineCommand } from '../registry'
import { readInputs, reportUnsupportedFlag, splitLines, usageError, writeLines } from './textInput'

/** @typedef {import('../registry').Ctx} Ctx */

const USAGE = 'grep [-inv] pattern [file...]'

/**
 * @param {string} line
 * @param {RegExp} globalPattern
 * @returns {string}
 */
const highlight = (line, globalPattern) =>
    line.replace(globalPattern, (match) => (match === '' ? match : style(match, 'bold', 'red')))

/**
 * @param {string} pattern
 * @param {string} flags
 * @returns {{ matcher: RegExp, highlighter: RegExp } | { error: string }}
 */
const compile = (pattern, flags) => {
    try {
        return { matcher: new RegExp(pattern, flags), highlighter: new RegExp(pattern, `${flags}g`) }
    } catch (error) {
        return { error: /** @type {Error} */ (error).message }
    }
}

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 */
const run = async (ctx, argv, stdin) => {
    const { flags, positionals } = splitFlags(argv)
    if (reportUnsupportedFlag(ctx, 'grep', flags, 'inv')) return 2
    const [pattern, ...files] = positionals
    if (pattern === undefined) return usageError(ctx, USAGE)
    const compiled = compile(pattern, flags.has('i') ? 'i' : '')
    if ('error' in compiled) {
        ctx.stderr(`grep: invalid regular expression: ${compiled.error}\n`)
        return 2
    }
    const { inputs, failed } = await readInputs(ctx, 'grep', files, stdin)
    if (inputs.length === 0 && !failed) return usageError(ctx, USAGE)

    const invert = flags.has('v')
    const withFileNames = files.length > 1
    let matched = false
    for (const input of inputs) {
        if (ctx.signal.aborted) break
        const filePrefix = withFileNames ? `${input.label}:` : ''
        /** @type {string[]} */
        const hits = []
        splitLines(input.text).forEach((line, index) => {
            if (compiled.matcher.test(line) === invert) return
            const linePrefix = flags.has('n') ? `${index + 1}:` : ''
            hits.push(`${filePrefix}${linePrefix}${invert ? line : highlight(line, compiled.highlighter)}`)
        })
        if (hits.length > 0) matched = true
        writeLines(ctx, hits)
    }
    if (failed) return 2
    return matched ? 0 : 1
}

export default defineCommand({
    name: 'grep',
    summary: 'print lines matching a pattern',
    usage: USAGE,
    run,
})
