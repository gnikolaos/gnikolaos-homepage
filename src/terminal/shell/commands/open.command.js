import profile from '../../profile'
import { defineCommand } from '../defineCommand'

const ALIASES = Object.keys(profile.links)
const USAGE = `open <${[...ALIASES, 'url'].join('|')}>`
const ALLOWED_SCHEMES = ['http://', 'https://', 'mailto:']

/**
 * @param {string} target
 * @returns {string | null}
 */
const resolveTarget = (target) => {
    if (Object.hasOwn(profile.links, target)) return profile.links[target]
    return ALLOWED_SCHEMES.some((scheme) => target.toLowerCase().startsWith(scheme)) ? target : null
}

export default defineCommand({
    name: 'open',
    summary: 'open a link in a new tab',
    usage: USAGE,
    complete: 'none',
    run: (ctx, argv) => {
        if (argv.length !== 1) {
            ctx.stderr(`usage: ${USAGE}\n`)
            return 1
        }
        const url = resolveTarget(argv[0])
        if (!url) {
            ctx.stderr(`open: unknown target: ${argv[0]}\n`)
            return 1
        }
        ctx.stdout(`Opening ${url}\n`)
        ctx.openUrl(url)
        return 0
    },
})
