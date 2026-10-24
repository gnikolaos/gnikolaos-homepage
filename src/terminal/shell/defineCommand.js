import { COMPLETION_KINDS } from './COMPLETION_KINDS'

/** @import { Command, CommandDefinition } from './types' */

/**
 * @param {boolean} condition
 * @param {string} message
 * @returns {asserts condition}
 */
const assert = (condition, message) => {
    if (!condition) throw new TypeError(message)
}

/**
 * @param {Required<CommandDefinition>} definition
 * @returns {void}
 */
const assertValidCommandDefinition = ({ name, summary, usage, complete, run }) => {
    assert(Boolean(name) && !/\s/.test(name), `invalid command name: '${name}'`)
    assert(typeof run === 'function', `command '${name}' has no run function`)
    assert(
        typeof summary === 'string' && typeof usage === 'string',
        `command '${name}' needs a summary and a usage string`,
    )
    assert(COMPLETION_KINDS.has(complete), `command '${name}' has unknown completion '${complete}'`)
}

/**
 * Validates a command definition and returns it frozen, with `hidden` and `complete` defaulted.
 * @param {CommandDefinition} definition
 * @returns {Command}
 */
const defineCommand = ({ name, summary, usage, hidden = false, complete = 'paths', run }) => {
    const command = { name, summary, usage, hidden, complete, run }
    assertValidCommandDefinition(command)
    return Object.freeze(command)
}

export { defineCommand }
