import { isFsError } from '../../fs/isFsError'
import { defineCommand } from '../defineCommand'
import { splitFlags } from '../splitFlags'
import { style } from '../style'
import profile from '../../profile'

/** @import { Ctx } from '../types' */
/** @import { Listing, ListingEntry, LongRow, LsOptions } from './types' */

const SUPPORTED_FLAGS = new Set(['a', 'l', 'all'])
const SIZE_UNITS = ['K', 'M', 'G', 'T']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SIX_MONTHS_MS = 182.5 * 24 * 60 * 60 * 1000
const OWNER_GROUP = `${profile.user} ${profile.user}`
const DOT_ENTRIES = /** @type {ListingEntry[]} */ ([
    { name: '.', type: 'dir' },
    { name: '..', type: 'dir' },
])

/**
 * @param {number | undefined} bytes
 * @returns {string}
 */
const formatSize = (bytes) => {
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
 * @param {Date} date
 * @param {Date} now
 * @returns {boolean}
 */
const isRecent = (date, now) => {
    const age = now.getTime() - date.getTime()
    return age >= 0 && age < SIX_MONTHS_MS
}

/**
 * @param {string | undefined} mtime
 * @param {Date} now
 * @returns {string}
 */
const formatDate = (mtime, now) => {
    const date = mtime ? new Date(mtime) : null
    if (!date || Number.isNaN(date.getTime())) return '-'
    const day = `${MONTHS[date.getUTCMonth()]} ${String(date.getUTCDate()).padStart(2)}`
    if (!isRecent(date, now)) return `${day}  ${date.getUTCFullYear()}`
    const time = [date.getUTCHours(), date.getUTCMinutes()].map((part) => String(part).padStart(2, '0')).join(':')
    return `${day} ${time}`
}

/**
 * @param {ListingEntry} entry
 * @param {{ slash?: boolean }} [options]
 * @returns {string}
 */
const formatEntryName = (entry, { slash = false } = {}) => {
    if (entry.type === 'dir') return style(slash ? `${entry.name}/` : entry.name, 'bold', 'blue')
    return entry.name.endsWith('.md') ? style(entry.name, 'green') : entry.name
}

/**
 * @param {ListingEntry[]} entries
 * @returns {string[]}
 */
const formatLongLines = (entries) => {
    const now = new Date()
    /** @type {LongRow[]} */
    const rows = entries.map((entry) => {
        const isDir = entry.type === 'dir'
        return {
            mode: isDir ? 'drwxr-xr-x' : '-rw-r--r--',
            links: isDir ? '2' : '1',
            size: isDir ? '-' : formatSize(entry.size),
            date: formatDate(entry.mtime, now),
            name: formatEntryName(entry),
        }
    })
    /** @param {'links' | 'size' | 'date'} column */
    const measureColumn = (column) => Math.max(0, ...rows.map((row) => row[column].length))
    const linksWidth = measureColumn('links')
    const sizeWidth = measureColumn('size')
    const dateWidth = measureColumn('date')
    return rows.map((row) =>
        [
            row.mode,
            row.links.padStart(linksWidth),
            OWNER_GROUP,
            row.size.padStart(sizeWidth),
            row.date.padEnd(dateWidth),
            row.name,
        ].join(' '),
    )
}

/**
 * @param {ListingEntry[]} entries
 * @param {LsOptions} options
 * @returns {string[]}
 */
const formatEntries = (entries, options) =>
    options.long ? formatLongLines(entries) : entries.map((entry) => formatEntryName(entry, { slash: true }))

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

export default defineCommand({
    name: 'ls',
    summary: 'list directory contents',
    usage: 'ls [-al] [path...]',
    run,
})
