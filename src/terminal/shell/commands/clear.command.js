import { defineCommand } from '../defineCommand'

export default defineCommand({
    name: 'clear',
    summary: 'clear the screen',
    usage: 'clear',
    complete: 'none',
    run: (ctx) => {
        ctx.clear()
    },
})
