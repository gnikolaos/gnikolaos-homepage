import { defineCommand } from '../registry'

export default defineCommand({
    name: 'home',
    summary: 'go back to the homepage',
    usage: 'home',
    run: (ctx) => {
        ctx.navigate('/')
    },
})
