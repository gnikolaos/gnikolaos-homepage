import { For, onCleanup, onMount, Show } from 'solid-js'
import { vfs } from '../fs/vfs'
import { derivePromptStatus } from '../store/derivePromptStatus'
import { terminal } from '../store/terminal'
import { hasTextSelection } from './hasTextSelection'
import HiddenInput from './HiddenInput'
import Output from './Output'
import Prompt from './Prompt'
import TerminalFooter from './TerminalFooter'

const BOTTOM_THRESHOLD_PX = 8
const MIN_COLUMNS = 20
const PROBE_CHARS = 10

const { state, actions } = terminal

/**
 * Renders the terminal: the scrollback of blocks, the active prompt, the hidden input and the footer.
 */
const Terminal = () => {
    /** @type {HTMLElement | undefined} */
    let main
    /** @type {HTMLDivElement | undefined} */
    let content
    /** @type {HTMLInputElement | undefined} */
    let input
    /** @type {HTMLSpanElement | undefined} */
    let probe
    let atBottom = true

    const onScroll = () => {
        if (!main) return
        atBottom = main.scrollHeight - main.scrollTop - main.clientHeight <= BOTTOM_THRESHOLD_PX
    }

    const onPointerUp = () => {
        if (hasTextSelection()) return
        input?.focus({ preventScroll: true })
    }

    const scrollToBottomIfPinned = () => {
        if (main && atBottom) main.scrollTop = main.scrollHeight
    }

    const measureColumns = () => {
        const cellWidth = (probe?.getBoundingClientRect().width ?? 0) / PROBE_CHARS
        if (!content || cellWidth <= 0) return
        const columns = Math.max(MIN_COLUMNS, Math.floor(content.clientWidth / cellWidth))
        actions.setColumns(columns)
    }

    onMount(() => {
        if (!content) return
        const observer = new ResizeObserver(() => {
            measureColumns()
            scrollToBottomIfPinned()
        })
        observer.observe(content)
        onCleanup(() => observer.disconnect())
    })

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
                    <For each={state.blocks}>
                        {(block) =>
                            block.kind === 'prompt' ? (
                                <Prompt
                                    path={vfs.formatDisplayPath(block.cwd)}
                                    status={block.status}
                                    running={block.running}
                                    input={block.input}
                                />
                            ) : (
                                <Output output={block.output} />
                            )
                        }
                    </For>
                    <Show when={!state.busy}>
                        <Prompt
                            path={vfs.formatDisplayPath(state.session.cwd)}
                            status={derivePromptStatus(state.lastExitCode)}
                            running={false}
                            input={state.editor.input}
                            cursor={state.editor.cursor}
                            search={state.search}
                        />
                    </Show>
                    <span ref={probe} aria-hidden="true" class="invisible absolute">
                        {'M'.repeat(PROBE_CHARS)}
                    </span>
                </div>
            </main>
            <HiddenInput ref={(el) => (input = el)} />
            <TerminalFooter />
        </div>
    )
}

export default Terminal
