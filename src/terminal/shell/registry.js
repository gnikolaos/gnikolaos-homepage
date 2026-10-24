import { commands } from './commands/index'
import { createRegistry } from './createRegistry'

/**
 * The app's command registry holding every built-in command.
 */
const registry = createRegistry(commands)

export { registry }
