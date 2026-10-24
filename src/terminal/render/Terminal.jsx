import { For, onCleanup, onMount, Show } from 'solid-js'
import { terminalState, vfs } from '../store/terminalStore'
import HiddenInput from './HiddenInput'
import Output from './Output'
import Prompt from './Prompt'
import TerminalFooter from './TerminalFooter'

const BOTTOM_THRESHOLD_PX = 8

const Terminal = () => {
    /** @type {HTMLElement | undefined} */
    let main
    /** @type {HTMLDivElement | undefined} */
    let content
    /** @type {HTMLInputElement | undefined} */
    let input
    let atBottom = true

    const onScroll = () => {
        if (!main) return
        atBottom = main.scrollHeight - main.scrollTop - main.clientHeight <= BOTTOM_THRESHOLD_PX
    }

    const onPointerUp = () => {
        if (window.getSelection()?.isCollapsed === false) return
        input?.focus({ preventScroll: true })
    }

    const scrollToBottomIfPinned = () => {
        if (main && atBottom) main.scrollTop = main.scrollHeight
    }

    onMount(() => {
        if (!content) return
        const observer = new ResizeObserver(scrollToBottomIfPinned)
        observer.observe(content)
        onCleanup(() => observer.disconnect())
    })

    const activeStatus = () => (terminalState.lastExitCode === 0 ? 'ok' : 'error')

    return (
        <div class="font-meslo relative flex size-full flex-col bg-black text-slate-100">
            <main
                ref={main}
                id="terminal"
                class="relative flex-1 overflow-y-auto p-4 text-sm leading-normal sm:text-base"
                onScroll={onScroll}
                onPointerUp={onPointerUp}
            >
                <div ref={content}>
                    <For each={terminalState.blocks}>
                        {(block) =>
                            block.kind === 'prompt' ? (
                                <Prompt path={vfs.displayPath(block.cwd)} status={block.status} input={block.input} />
                            ) : (
                                <Output output={block.output} />
                            )
                        }
                    </For>
                    <Show when={!terminalState.busy}>
                        <Prompt
                            path={vfs.displayPath(terminalState.session.cwd)}
                            status={activeStatus()}
                            input={terminalState.editor.input}
                            cursor={terminalState.editor.cursor}
                        />
                    </Show>
                </div>
            </main>
            <HiddenInput ref={(el) => (input = el)} />
            <TerminalFooter />
        </div>
    )
}

export default Terminal
