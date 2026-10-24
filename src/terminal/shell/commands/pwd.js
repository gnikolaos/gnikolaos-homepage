import { defineCommand } from '../registry'

export default defineCommand({
    name: 'pwd',
    summary: 'print the working directory',
    usage: 'pwd',
    run: (ctx) => {
        ctx.stdout(`${ctx.cwd}\n`)
    },
})
