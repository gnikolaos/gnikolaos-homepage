/** @import { Ctx } from '../types' */

/**
 * Prints `<name>: invalid option -- 'x'` for the first flag outside the supported letters and returns whether it did.
 * @param {Ctx} ctx
 * @param {string} name
 * @param {Set<string>} flags
 * @param {string} supportedLetters
 * @returns {boolean}
 */
const reportUnsupportedFlag = (ctx, name, flags, supportedLetters) => {
    const isSupported = (/** @type {string} */ flag) => flag.length === 1 && supportedLetters.includes(flag)
    const unsupported = [...flags].find((flag) => !isSupported(flag))
    if (unsupported === undefined) return false
    ctx.stderr(`${name}: invalid option -- '${unsupported}'\n`)
    return true
}

export { reportUnsupportedFlag }
