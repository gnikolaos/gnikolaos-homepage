import { onMount } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import Terminal from '@gnikolaos/terminal/render/Terminal'
import { planDeepLink } from '@gnikolaos/terminal/planDeepLink'
import { terminal } from '@gnikolaos/terminal/store/terminal'

/**
 * Renders the terminal page, running the deep link's commands on first visit.
 */
const TerminalRoute = () => {
    const params = useParams()
    const navigate = useNavigate()
    terminal.actions.setNavigate((path) => navigate(path))

    onMount(async () => {
        if (terminal.state.blocks.length > 0) return
        for (const line of planDeepLink(params.path)) await terminal.actions.runLine(line)
    })

    return <Terminal />
}

export default TerminalRoute
