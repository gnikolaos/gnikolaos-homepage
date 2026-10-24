import { isFsError } from '../../fs/FsError'
import { defineCommand } from '../registry'
import { splitFlags } from '../flags'

/** @typedef {import('../registry').Ctx} Ctx */
/** @typedef {{ name: string, type: 'dir' | 'file', size?: number, mtime?: string, title?: string }} Entry */
/** @typedef {{ all: boolean, long: boolean }} LsOptions */
/** @typedef {{ isDir: boolean, entries: Entry[] }} Listing */

const SUPPORTED_FLAGS = new Set(['a', 'l', 'all'])
const SIZE_UNITS = ['K', 'M', 'G', 'T']
const DOT_ENTRIES = /** @type {Entry[]} */ ([
    { name: '.', type: 'dir' },
    { name: '..', type: 'dir' },
])

/**
 * @param {number | undefined} bytes
 * @returns {string}
 */
const humanSize = (bytes) => {
    if (bytes === undefined || !Number.isFinite(bytes)) return '-'
    if (bytes < 1024) return String(bytes)
    let value = bytes
    let unit = -1
    while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
        value /= 1024
        unit += 1
    }
    const rounded = value < 10 ? value.toFixed(1) : String(Math.round(value))
    return `${rounded}${SIZE_UNITS[unit]}`
}

/**
 * @param {string | undefined} mtime
 * @returns {string}
 */
const shortDate = (mtime) => {
    const date = mtime ? new Date(mtime) : null
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '-'
}

/**
 * @param {Entry} entry
 * @returns {string}
 */
const displayName = (entry) => (entry.type === 'dir' ? `${entry.name}/` : entry.name)

/**
 * @param {Entry[]} entries
 * @returns {string[]}
 */
const longLines = (entries) => {
    const rows = entries.map((entry) => ({
        type: entry.type === 'dir' ? 'd' : '-',
        size: entry.type === 'dir' ? '-' : humanSize(entry.size),
        date: shortDate(entry.mtime),
        name: displayName(entry),
    }))
    const sizeWidth = Math.max(0, ...rows.map((row) => row.size.length))
    const dateWidth = Math.max(0, ...rows.map((row) => row.date.length))
    return rows.map((row) => `${row.type} ${row.size.padStart(sizeWidth)} ${row.date.padEnd(dateWidth)} ${row.name}`)
}

/**
 * @param {Entry[]} entries
 * @param {LsOptions} options
 * @returns {string[]}
 */
const formatEntries = (entries, options) => (options.long ? longLines(entries) : entries.map(displayName))

/**
 * @param {Ctx} ctx
 * @param {string} target
 * @param {LsOptions} options
 * @returns {Promise<Listing>}
 */
const readListing = async (ctx, target, options) => {
    const absPath = ctx.fs.resolve(ctx.cwd, target)
    const entry = await ctx.fs.stat(absPath)
    if (entry.type === 'file') return { isDir: false, entries: [{ ...entry, name: target }] }
    const children = await ctx.fs.readdir(absPath)
    return { isDir: true, entries: options.all ? [...DOT_ENTRIES, ...children] : children }
}

/**
 * @param {Set<string>} flags
 * @returns {string | undefined}
 */
const findUnsupportedFlag = (flags) => [...flags].find((flag) => !SUPPORTED_FLAGS.has(flag))

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 */
const run = async (ctx, argv) => {
    const { flags, positionals } = splitFlags(argv)
    const unsupported = findUnsupportedFlag(flags)
    if (unsupported) {
        ctx.stderr(`ls: invalid option -- '${unsupported}'\n`)
        return 2
    }
    const options = { all: flags.has('a') || flags.has('all'), long: flags.has('l') }
    const targets = positionals.length > 0 ? positionals : ['.']
    const withHeaders = targets.length > 1
    let failed = false
    let printedBlock = false

    for (const target of targets) {
        if (ctx.signal.aborted) break
        let listing
        try {
            listing = await readListing(ctx, target, options)
        } catch (error) {
            if (!isFsError(error)) throw error
            ctx.stderr(`ls: cannot access '${target}': ${error.description}\n`)
            failed = true
            continue
        }
        if (printedBlock) ctx.stdout('\n')
        if (withHeaders && listing.isDir) ctx.stdout(`${target}:\n`)
        for (const line of formatEntries(listing.entries, options)) ctx.stdout(`${line}\n`)
        printedBlock = true
    }
    return failed ? 1 : 0
}

export { humanSize, shortDate }

export default defineCommand({
    name: 'ls',
    summary: 'list directory contents',
    usage: 'ls [-al] [path...]',
    run,
})
