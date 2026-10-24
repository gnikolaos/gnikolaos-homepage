import { vfs } from '../fs/vfs'
import { createCompleter } from '../shell/createCompleter'
import { createShell } from '../shell/createShell'
import { registry } from '../shell/registry'
import profile from '../profile'
import { createBrowserStorage } from './createBrowserStorage'
import { createTerminal } from './createTerminal'

/** @import { TerminalStore } from './types' */

/**
 * The app's terminal store: its state and actions.
 * @type {TerminalStore}
 */
const terminal = createTerminal({
    home: vfs.home,
    storage: createBrowserStorage(),
    complete: createCompleter({ fs: vfs, registry, getCwd: () => terminal.state.session.cwd }),
    makeShell: (hooks) =>
        createShell({ ...hooks, registry, fs: vfs, session: { user: profile.user, host: profile.host } }),
})

export { terminal }
