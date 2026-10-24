import { createFakeCtx } from './createFakeCtx'

/** @typedef {import('@gnikolaos/terminal/shell/registry').Command} Command */

/**
 * Runs a command against a fake ctx and returns what it recorded plus its exit code.
 * @param {Command} command
 * @param {string[]} argv
 * @param {Parameters<typeof createFakeCtx>[0] & { stdin?: string | null }} [options]
 */
const runCommand = async (command, argv, { stdin = null, ...options } = {}) => {
    const fake = createFakeCtx(options)
    const result = await command.run(fake.ctx, argv, stdin)
    return { ...fake, exitCode: result ?? 0 }
}

export { runCommand }
