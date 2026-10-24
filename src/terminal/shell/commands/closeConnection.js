import profile from '../../profile'

/** @import { Ctx } from '../types' */

/**
 * Prints the ssh-style goodbye line and navigates back to the homepage.
 * @param {Ctx} ctx
 */
const closeConnection = (ctx) => {
    ctx.stdout(`Connection to ${profile.host} closed.\n`)
    ctx.navigate('/')
}

export { closeConnection }
