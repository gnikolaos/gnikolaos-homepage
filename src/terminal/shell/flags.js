/** @typedef {{ flags: Set<string>, positionals: string[] }} SplitFlags */

/**
 * @param {string} arg
 * @returns {string[]}
 */
const flagsOf = (arg) => (arg.startsWith('--') ? [arg.slice(2)] : [...arg.slice(1)])

/**
 * @param {string} arg
 * @returns {boolean}
 */
const isFlag = (arg) => arg.length > 1 && arg.startsWith('-')

/**
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
            for (const flag of flagsOf(arg)) flags.add(flag)
        } else {
            positionals.push(arg)
        }
    }
    return { flags, positionals }
}

export { splitFlags }
