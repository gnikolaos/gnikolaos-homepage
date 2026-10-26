import { defineCommand } from '../defineCommand'

export default defineCommand({
    name: 'home',
    summary: 'go back to the homepage',
    usage: 'home',
    hidden: true,
    complete: 'none',
    run: (ctx) => {
        ctx.navigate('/')
    },
})
