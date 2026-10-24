import { splitFlags } from '../flags'
import { defineCommand } from '../registry'
import { readInputs, reportUnsupportedFlag, usageError, writeLines } from './textInput'

/** @typedef {import('../registry').Ctx} Ctx */
/** @typedef {'l' | 'w' | 'c'} CountKey */
/** @typedef {Record<CountKey, number>} Counts */
/** @typedef {{ counts: Counts, label: string | null }} Row */

const USAGE = 'wc [-lwc] [file...]'
/** @type {CountKey[]} */
const COUNT_KEYS = ['l', 'w', 'c']

/**
 * @param {string} text
 * @returns {Counts}
 */
const countText = (text) => ({
    l: text.split('\n').length - 1,
    w: text.match(/\S+/g)?.length ?? 0,
    c: new TextEncoder().encode(text).length,
})

/**
 * @param {Counts[]} counts
 * @returns {Counts}
 */
const sumCounts = (counts) =>
    counts.reduce((total, row) => ({ l: total.l + row.l, w: total.w + row.w, c: total.c + row.c }), {
        l: 0,
        w: 0,
        c: 0,
    })

/**
 * @param {Row[]} rows
 * @param {CountKey[]} keys
 * @returns {string[]}
 */
const formatRows = (rows, keys) => {
    const width = Math.max(1, ...rows.flatMap((row) => keys.map((key) => String(row.counts[key]).length)))
    return rows.map((row) => {
        const fields = keys.map((key) => String(row.counts[key]).padStart(width)).join(' ')
        return row.label === null ? fields : `${fields} ${row.label}`
    })
}

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 */
const run = async (ctx, argv, stdin) => {
    const { flags, positionals: files } = splitFlags(argv)
    if (reportUnsupportedFlag(ctx, 'wc', flags, 'lwc')) return 2
    const { inputs, failed } = await readInputs(ctx, 'wc', files, stdin)
    if (inputs.length === 0 && !failed) return usageError(ctx, USAGE)

    const selected = COUNT_KEYS.filter((key) => flags.has(key))
    /** @type {Row[]} */
    const rows = []
    for (const input of inputs) {
        if (ctx.signal.aborted) break
        rows.push({ counts: countText(input.text), label: input.label })
    }
    if (files.length > 1) rows.push({ counts: sumCounts(rows.map((row) => row.counts)), label: 'total' })
    writeLines(ctx, formatRows(rows, selected.length > 0 ? selected : COUNT_KEYS))
    return failed ? 1 : 0
}

export default defineCommand({
    name: 'wc',
    summary: 'count lines, words and bytes',
    usage: USAGE,
    run,
})
