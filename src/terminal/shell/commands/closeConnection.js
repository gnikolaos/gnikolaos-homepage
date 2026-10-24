import { sleep } from '@gnikolaos/lib/shared/sleep'
import profile from '../../profile'

/** @import { Ctx } from '../types' */

const GOODBYE_DELAY_MS = 600

/**
 * Prints the ssh-style goodbye line, pauses so it can be read, then closes the session.
 * @param {Ctx} ctx
 * @returns {Promise<void>}
 */
const closeConnection = async (ctx) => {
    ctx.stdout(`Connection to ${profile.host} closed.\n`)
    await sleep(GOODBYE_DELAY_MS, ctx.signal)
    ctx.closeSession()
}

export { closeConnection }
