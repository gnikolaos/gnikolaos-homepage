import { defineCommand } from '../registry'

export default defineCommand({
    name: 'clear',
    summary: 'clear the screen',
    usage: 'clear',
    run: (ctx) => {
        ctx.clear()
    },
})
