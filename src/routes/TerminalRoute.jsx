import { onCleanup, onMount } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { connection } from '@gnikolaos/connection/connection'
import { buildBootSteps } from '@gnikolaos/terminal/intro/buildBootSteps'
import { planDeepLink } from '@gnikolaos/terminal/planDeepLink'
import profile from '@gnikolaos/terminal/profile'
import Terminal from '@gnikolaos/terminal/render/Terminal'
import { terminal } from '@gnikolaos/terminal/store/terminal'

/**
 * Renders the terminal page, playing the boot or reconnect intro and then the deep link's commands on first visit.
 */
const TerminalRoute = () => {
    const params = useParams()
    const navigate = useNavigate()
    terminal.actions.setNavigate((path) => navigate(path))

    // The browser bars stay black around the terminal, and go back to the mesh colour when it closes.
    const themeColor = document.querySelector('meta[name="theme-color"]')
    const pageThemeColor = themeColor?.getAttribute('content') ?? ''
    themeColor?.setAttribute('content', '#000000')
    onCleanup(() => themeColor?.setAttribute('content', pageThemeColor))

    onMount(async () => {
        if (!connection.booted()) terminal.actions.endSession()
        if (terminal.state.blocks.length > 0) return
        const lines = planDeepLink(params.path)
        const reconnect = connection.booted() || lines.length > 0
        connection.markBooted()
        if (reconnect) {
            await terminal.actions.playIntro([{ text: `Connected to ${profile.host}.\n`, delayMs: 0 }])
        } else {
            await terminal.actions.playIntro(
                buildBootSteps({
                    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                    user: profile.user,
                    host: profile.host,
                    ip: `10.0.0.${2 + Math.floor(Math.random() * 253)}`,
                    lastLoginAt: connection.recordLogin(),
                }),
            )
        }
        for (const line of lines) await terminal.actions.runLine(line)
    })

    return <Terminal />
}

export default TerminalRoute
