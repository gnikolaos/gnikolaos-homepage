/** @typedef {import('./types').Command} Command */
/** @typedef {import('./types').Registry} Registry */

/**
 * Creates a registry that looks commands up by name and lists them sorted, rejecting duplicate names.
 * @param {Command[]} commands
 * @returns {Registry}
 */
const createRegistry = (commands) => {
    const byName = new Map()
    for (const command of commands) {
        if (byName.has(command.name)) throw new Error(`duplicate command: '${command.name}'`)
        byName.set(command.name, command)
    }
    const sorted = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))

    return {
        get: (name) => byName.get(name),
        has: (name) => byName.has(name),
        list: ({ includeHidden = false } = {}) =>
            includeHidden ? sorted : sorted.filter((command) => !command.hidden),
    }
}

export { createRegistry }
