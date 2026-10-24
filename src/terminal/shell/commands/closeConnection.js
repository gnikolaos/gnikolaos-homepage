import profile from '../../profile'

/** @typedef {import('../types').Ctx} Ctx */

/**
 * Prints the ssh-style goodbye line and navigates back to the homepage.
 * @param {Ctx} ctx
 */
const closeConnection = (ctx) => {
    ctx.stdout(`Connection to ${profile.host} closed.\n`)
    ctx.navigate('/')
}

export { closeConnection }
