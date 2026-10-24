import { splitLines } from './splitLines'

/** @typedef {import('../types').Ctx} Ctx */
/** @typedef {import('./types').TextInput} TextInput */

/**
 * Joins the lines of every input into one list, stopping once the command is aborted.
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

export { concatLines }
