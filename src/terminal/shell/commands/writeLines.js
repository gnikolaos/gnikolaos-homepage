/** @typedef {import('../types').Ctx} Ctx */

/**
 * Writes every line to stdout followed by a newline, writing nothing for no lines.
 * @param {Ctx} ctx
 * @param {string[]} lines
 */
const writeLines = (ctx, lines) => {
    if (lines.length > 0) ctx.stdout(lines.map((line) => `${line}\n`).join(''))
}

export { writeLines }
