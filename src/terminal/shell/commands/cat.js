import { isFsError } from '../../fs/FsError'
import { defineCommand } from '../registry'

/** @typedef {import('../registry').Ctx} Ctx */

const USAGE = 'cat file...'

/**
 * @param {string} text
 * @returns {string}
 */
const withTrailingNewline = (text) => (text === '' || text.endsWith('\n') ? text : `${text}\n`)

/**
 * @param {string} absPath
 * @returns {boolean}
 */
const isMarkdown = (absPath) => absPath.toLowerCase().endsWith('.md')

/**
 * @param {Ctx} ctx
 * @param {string} absPath
 * @param {string} content
 */
const emitFile = (ctx, absPath, content) => {
    if (isMarkdown(absPath)) ctx.markdown(content)
    else ctx.stdout(withTrailingNewline(content))
}

/**
 * @param {Ctx} ctx
 * @param {string[]} targets
 * @returns {Promise<number>}
 */
const catFiles = async (ctx, targets) => {
    let failed = false
    let printedFile = false
    for (const target of targets) {
        if (ctx.signal.aborted) break
        const absPath = ctx.fs.resolve(ctx.cwd, target)
        let content
        try {
            content = await ctx.fs.readFile(absPath)
        } catch (error) {
            if (!isFsError(error)) throw error
            ctx.stderr(`cat: ${target}: ${error.description}\n`)
            failed = true
            continue
        }
        if (printedFile) ctx.stdout('\n')
        emitFile(ctx, absPath, content)
        printedFile = true
    }
    return failed ? 1 : 0
}

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 * @param {string | null} stdin
 */
const run = async (ctx, argv, stdin) => {
    if (argv.length > 0) return catFiles(ctx, argv)
    if (stdin !== null) {
        ctx.stdout(stdin)
        return 0
    }
    ctx.stderr(`usage: ${USAGE}\n`)
    return 1
}

export default defineCommand({
    name: 'cat',
    summary: 'print file contents',
    usage: USAGE,
    run,
})
