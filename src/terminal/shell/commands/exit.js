import profile from '../../profile'
import { defineCommand } from '../defineCommand'

/** @typedef {import('../types').Ctx} Ctx */

/**
 * @param {Ctx} ctx
 */
const closeConnection = (ctx) => {
    ctx.stdout(`Connection to ${profile.host} closed.\n`)
    ctx.navigate('/')
}

const logout = defineCommand({
    name: 'logout',
    summary: 'leave the terminal',
    usage: 'logout',
    complete: 'none',
    run: closeConnection,
})

export { logout }

export default defineCommand({
    name: 'exit',
    summary: 'leave the terminal',
    usage: 'exit',
    complete: 'none',
    run: closeConnection,
})
