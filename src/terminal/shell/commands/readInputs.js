import { FsError } from '../../fs/FsError'

/** @import { Ctx } from '../types' */
/** @import { ReadInputsResult, TextInput } from './types' */

/**
 * Reads the named files, or stdin when there are none, reporting fs errors as `<name>: <file>: <description>`.
 * @param {Ctx} ctx
 * @param {string} name
 * @param {string[]} files
 * @param {string | null} stdin
 * @returns {Promise<ReadInputsResult>}
 */
const readInputs = async (ctx, name, files, stdin) => {
    if (files.length === 0) return { inputs: stdin === null ? [] : [{ label: null, text: stdin }], failed: false }
    /** @type {TextInput[]} */
    const inputs = []
    let failed = false
    for (const file of files) {
        if (ctx.signal.aborted) break
        try {
            inputs.push({ label: file, text: await ctx.fs.readFile(ctx.fs.resolve(ctx.cwd, file)) })
        } catch (error) {
            if (!(error instanceof FsError)) throw error
            ctx.stderr(`${name}: ${file}: ${error.description}\n`)
            failed = true
        }
    }
    return { inputs, failed }
}

export { readInputs }
