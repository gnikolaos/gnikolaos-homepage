/** @import { SplitFlags } from './types' */

/**
 * @param {string} arg
 * @returns {string[]}
 */
const extractFlagNames = (arg) => (arg.startsWith('--') ? [arg.slice(2)] : [...arg.slice(1)])

/**
 * @param {string} arg
 * @returns {boolean}
 */
const isFlag = (arg) => arg.length > 1 && arg.startsWith('-')

/**
 * Splits argv into a set of flag names and the remaining positionals, treating everything after `--` as positional.
 * @param {string[]} argv
 * @returns {SplitFlags}
 */
const splitFlags = (argv) => {
    const flags = new Set()
    /** @type {string[]} */
    const positionals = []
    let parsingFlags = true
    for (const arg of argv) {
        if (parsingFlags && arg === '--') {
            parsingFlags = false
        } else if (parsingFlags && isFlag(arg)) {
            for (const flag of extractFlagNames(arg)) flags.add(flag)
        } else {
            positionals.push(arg)
        }
    }
    return { flags, positionals }
}

export { splitFlags }
