import { connection } from '@gnikolaos/connection/connection'
import { createBrowserStorage } from '@gnikolaos/lib/shared/createBrowserStorage'
import { vfs } from '../fs/vfs'
import { createCompleter } from '../shell/createCompleter'
import { createShell } from '../shell/createShell'
import { registry } from '../shell/registry'
import profile from '../profile'
import { createTerminal } from './createTerminal'

/** @import { TerminalStore } from './types' */

/**
 * The app's terminal store: its state and actions.
 * @type {TerminalStore}
 */
const terminal = createTerminal({
    home: vfs.home,
    storage: createBrowserStorage('sessionStorage'),
    complete: createCompleter({ fs: vfs, registry, getCwd: () => terminal.state.session.cwd }),
    onSessionClose: connection.disconnect,
    makeShell: (hooks) =>
        createShell({ ...hooks, registry, fs: vfs, session: { user: profile.user, host: profile.host } }),
})

export { terminal }
