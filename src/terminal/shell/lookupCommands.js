/** @import { Command, Registry, Stage } from './types' */

/**
 * Looks up the command of every pipeline stage, reporting the first name the registry lacks.
 * @param {Registry} registry
 * @param {Stage[]} pipeline
 * @returns {{ commands: Command[] } | { missing: string }}
 */
const lookupCommands = (registry, pipeline) => {
    const commands = []
    for (const { argv } of pipeline) {
        const command = registry.get(argv[0])
        if (!command) return { missing: argv[0] }
        commands.push(command)
    }
    return { commands }
}

export { lookupCommands }
