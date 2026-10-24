/** @typedef {import('../types').Ctx} Ctx */

/**
 * Prints the usage line to stderr and returns the usage exit code 2.
 * @param {Ctx} ctx
 * @param {string} usage
 * @returns {number}
 */
const reportUsageError = (ctx, usage) => {
    ctx.stderr(`usage: ${usage}\n`)
    return 2
}

export { reportUsageError }
