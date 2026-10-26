import { defineCommand } from '../defineCommand'
import { closeConnection } from './closeConnection'

export default defineCommand({
    name: 'logout',
    summary: 'leave the terminal',
    usage: 'logout',
    hidden: true,
    complete: 'none',
    run: closeConnection,
})
