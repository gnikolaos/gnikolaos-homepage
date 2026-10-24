import { onMount } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { connection } from '@gnikolaos/connection/connection'
import { buildBootSteps } from '@gnikolaos/terminal/intro/buildBootSteps'
import { planDeepLink } from '@gnikolaos/terminal/planDeepLink'
import profile from '@gnikolaos/terminal/profile'
import Terminal from '@gnikolaos/terminal/render/Terminal'
import { terminal } from '@gnikolaos/terminal/store/terminal'

/** @import { IntroStep } from '@gnikolaos/terminal/intro/types' */

/** @type {IntroStep[]} */
const RECONNECT_STEPS = [{ text: `Connected to ${profile.host}.\n`, delayMs: 0 }]

const buildBrowserBootSteps = () =>
    buildBootSteps({
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        user: profile.user,
        host: profile.host,
        ip: `10.0.0.${2 + Math.floor(Math.random() * 253)}`,
        lastLoginAt: connection.recordLogin(),
    })

/**
 * Renders the terminal page, playing the boot or reconnect intro and then the deep link's commands on first visit.
 */
const TerminalRoute = () => {
    const params = useParams()
    const navigate = useNavigate()
    terminal.actions.setNavigate((path) => navigate(path))

    onMount(async () => {
        if (!connection.booted()) terminal.actions.endSession()
        if (terminal.state.blocks.length > 0) return
        const lines = planDeepLink(params.path)
        const reconnect = connection.booted() || lines.length > 0
        connection.markBooted()
        await terminal.actions.playIntro(reconnect ? RECONNECT_STEPS : buildBrowserBootSteps())
        for (const line of lines) await terminal.actions.runLine(line)
    })

    return <Terminal />
}

export default TerminalRoute
