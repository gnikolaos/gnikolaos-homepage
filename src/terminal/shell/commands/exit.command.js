import { defineCommand } from '../defineCommand'
import { closeConnection } from './closeConnection'

export default defineCommand({
    name: 'exit',
    summary: 'leave the terminal',
    usage: 'exit',
    complete: 'none',
    run: closeConnection,
})
