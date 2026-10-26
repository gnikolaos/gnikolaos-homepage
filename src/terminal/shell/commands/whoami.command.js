import { defineCommand } from '../defineCommand'

export default defineCommand({
    name: 'whoami',
    summary: 'show what your browser tells this page',
    usage: 'whoami',
    hidden: true,
    complete: 'none',
    run: (ctx, argv) => {
        if (argv.length > 0) {
            ctx.stderr(`whoami: extra operand '${argv[0]}'\n`)
            return 1
        }
        const info = ctx.readBrowserInfo()
        const rows = [
            ['os', info.os ?? 'unknown'],
            ['browser', info.browser ?? 'unknown'],
            ['language', info.languageRegion === null ? info.language : `${info.language} (${info.languageRegion})`],
            ['timezone', info.timezone],
            ['viewport', `${info.viewport.width}x${info.viewport.height}`],
            ['screen', `${info.screen.width}x${info.screen.height} @${info.screen.pixelRatio}x`],
            ['theme', info.darkTheme ? 'dark' : 'light'],
            ['motion', info.reducedMotion ? 'reduced' : 'no preference'],
            ['touch', info.touch ? 'yes' : 'no'],
        ]
        ctx.stdout(`${ctx.session.user}\n`)
        ctx.stdout('\n')
        rows.forEach(([key, value]) => ctx.stdout(`  ${key.padEnd(9)} ${value}\n`))
        ctx.stdout('\n')
        ctx.stdout('Read by your browser, shown only to you, not stored.\n')
        return 0
    },
})
