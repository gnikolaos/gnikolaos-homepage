/**
 * @typedef {object} Ctx
 * @property {import('../fs/vfs').Vfs} fs
 * @property {string} cwd
 * @property {(absPath: string) => void} setCwd
 * @property {string} home
 * @property {{ user: string, host: string }} session
 * @property {readonly string[]} history
 * @property {Registry} registry
 * @property {(path: string) => void} navigate
 * @property {(url: string) => void} openUrl
 * @property {AbortSignal} signal
 * @property {(text: string) => void} stdout
 * @property {(text: string) => void} stderr
 * @property {(content: string) => void} markdown
 * @property {() => void} clear
 */

/**
 * @typedef {object} Command
 * @property {string} name
 * @property {string} summary
 * @property {string} usage
 * @property {boolean} hidden
 * @property {(ctx: Ctx, argv: string[], stdin: string | null) => number | void | Promise<number | void>} run
 */

/**
 * @typedef {object} Registry
 * @property {(name: string) => Command | undefined} get
 * @property {(name: string) => boolean} has
 * @property {(options?: { includeHidden?: boolean }) => Command[]} list
 */

/**
 * @param {{ name: string, summary: string, usage: string, hidden?: boolean, run: Command['run'] }} def
 * @returns {Command}
 */
const defineCommand = ({ name, summary, usage, hidden = false, run }) => {
    if (!name || /\s/.test(name)) throw new TypeError(`invalid command name: '${name}'`)
    if (typeof run !== 'function') throw new TypeError(`command '${name}' has no run function`)
    if (typeof summary !== 'string' || typeof usage !== 'string') {
        throw new TypeError(`command '${name}' needs a summary and a usage string`)
    }
    return Object.freeze({ name, summary, usage, hidden, run })
}

/**
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
        list: ({ includeHidden = false } = {}) => (includeHidden ? sorted : sorted.filter((c) => !c.hidden)),
    }
}

export { defineCommand, createRegistry }
