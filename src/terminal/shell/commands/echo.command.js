import { defineCommand } from '../defineCommand'

export default defineCommand({
    name: 'echo',
    summary: 'print arguments',
    usage: 'echo [-n] args...',
    run: (ctx, argv) => {
        const omitNewline = argv[0] === '-n'
        const words = omitNewline ? argv.slice(1) : argv
        ctx.stdout(words.join(' ') + (omitNewline ? '' : '\n'))
    },
})
