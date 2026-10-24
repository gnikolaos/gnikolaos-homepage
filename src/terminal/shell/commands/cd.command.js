import { isFsError } from '../../fs/isFsError'
import { defineCommand } from '../defineCommand'

/** @typedef {import('../types').Ctx} Ctx */

/**
 * @param {Ctx} ctx
 * @param {string} target
 * @returns {Promise<string | null>}
 */
const findDirectoryError = async (ctx, target) => {
    try {
        const entry = await ctx.fs.stat(ctx.fs.resolve(ctx.cwd, target))
        return entry.type === 'dir' ? null : `cd: not a directory: ${target}`
    } catch (error) {
        if (!isFsError(error)) throw error
        return error.code === 'ENOTDIR' ? `cd: not a directory: ${target}` : `cd: no such file or directory: ${target}`
    }
}

/**
 * @param {Ctx} ctx
 * @param {string[]} argv
 */
const run = async (ctx, argv) => {
    if (argv.length > 1) {
        ctx.stderr('cd: too many arguments\n')
        return 1
    }
    const target = argv[0] ?? ''
    if (target === '') {
        ctx.setCwd(ctx.home)
        return 0
    }
    const error = await findDirectoryError(ctx, target)
    if (error) {
        ctx.stderr(`${error}\n`)
        return 1
    }
    ctx.setCwd(ctx.fs.resolve(ctx.cwd, target))
    return 0
}

export default defineCommand({
    name: 'cd',
    summary: 'change the working directory',
    usage: 'cd [path]',
    complete: 'dirs',
    run,
})
