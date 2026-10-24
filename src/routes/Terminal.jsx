import { onMount } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import Terminal from '@gnikolaos/terminal/render/Terminal'
import { planDeepLink } from '@gnikolaos/terminal/planDeepLink'
import { runLine, setNavigate, terminalState } from '@gnikolaos/terminal/store/terminalStore'

const TerminalRoute = () => {
    const params = useParams()
    const navigate = useNavigate()
    setNavigate((path) => navigate(path))

    onMount(async () => {
        if (terminalState.blocks.length > 0) return
        for (const line of planDeepLink(params.path)) await runLine(line)
    })

    return <Terminal />
}

export default TerminalRoute
