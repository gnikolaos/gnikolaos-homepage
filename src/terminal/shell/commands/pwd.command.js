import { defineCommand } from '../defineCommand'

export default defineCommand({
    name: 'pwd',
    summary: 'print the working directory',
    usage: 'pwd',
    complete: 'none',
    run: (ctx) => {
        ctx.stdout(`${ctx.cwd}\n`)
    },
})
