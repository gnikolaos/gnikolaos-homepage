import { createEffect, For, on, onCleanup, onMount, Show } from 'solid-js'
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
    const findLastPrompt = () => state.blocks.findLast((block) => block.kind === 'prompt')
    let settledPromptId = findLastPrompt()?.id

    const onScroll = () => {
        if (!main) return
        atBottom = main.scrollHeight - main.scrollTop - main.clientHeight <= BOTTOM_THRESHOLD_PX
        if (!atBottom) settledPromptId = findLastPrompt()?.id
    }

    const onPointerUp = () => {
        if (hasTextSelection()) return
        input?.focus({ preventScroll: true })
        if (state.introPlaying) actions.skipIntro()
    }

    const scrollToBottom = () => {
        if (!main) return
        main.scrollTop = main.scrollHeight
        atBottom = true
    }

    /**
     * Anchors a new command's overflowing output at its prompt line, otherwise keeps the view pinned to the bottom.
     */
    const followOutput = () => {
        if (!main || !content) return
        const prompt = findLastPrompt()
        if (!prompt || prompt.id === settledPromptId) {
            if (atBottom) scrollToBottom()
            return
        }
        const anchor = /** @type {HTMLElement} */ (content.querySelector(`[data-prompt-id="${prompt.id}"]`))
        const anchorTop = anchor.offsetTop - content.offsetTop
        if (main.scrollHeight - anchorTop <= main.clientHeight) {
            scrollToBottom()
            if (!state.busy) settledPromptId = prompt.id
            return
        }
        main.scrollTop = anchorTop
        atBottom = false
        settledPromptId = prompt.id
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
            followOutput()
        })
        observer.observe(content)
        onCleanup(() => observer.disconnect())
    })

    createEffect(on(() => [state.editor.input, state.editor.cursor, state.search], scrollToBottom, { defer: true }))

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
                                <div data-prompt-id={block.id}>
                                    <Prompt
                                        path={vfs.formatDisplayPath(block.cwd)}
                                        status={block.status}
                                        running={block.running}
                                        input={block.input}
                                    />
                                </div>
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
