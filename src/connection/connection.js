import { createBrowserStorage } from '@gnikolaos/lib/shared/createBrowserStorage'
import { createConnection } from './createConnection'

/** @import { Connection } from './types' */

/**
 * The app's connection store: cable, boot and last login state.
 * @type {Connection}
 */
const connection = createConnection({
    session: createBrowserStorage('sessionStorage'),
    local: createBrowserStorage('localStorage'),
})

export { connection }
