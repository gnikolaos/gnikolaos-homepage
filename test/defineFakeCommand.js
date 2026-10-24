import { defineCommand } from '@gnikolaos/terminal/shell/defineCommand'
import { doNothing } from './doNothing'

/** @import { Command, CompletionKind } from '@gnikolaos/terminal/shell/types' */

/**
 * Defines a command with a placeholder summary and usage, running `run` or nothing.
 * @param {string} name
 * @param {{ run?: Command['run'], hidden?: boolean, complete?: CompletionKind }} [options]
 * @returns {Command}
 */
const defineFakeCommand = (name, { run = doNothing, hidden = false, complete } = {}) =>
    defineCommand({ name, summary: `${name} summary`, usage: name, hidden, complete, run })

export { defineFakeCommand }
