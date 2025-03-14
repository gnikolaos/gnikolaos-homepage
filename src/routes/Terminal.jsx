import snarkdown from 'snarkdown'
import { terminalStore } from '@gnikolaos/components/terminal/store/terminalStore'
import TerminalFooter from '@gnikolaos/components/terminal/TerminalFooter'
import { For, Match, onMount, Show, Switch } from 'solid-js'
import { createStore } from 'solid-js/store'
import { formatContent, renderText } from '@gnikolaos/components/terminal/utils'

/**
 * Terminal route simulates a Unix-like "command line" interface.
 * Allows users to input commands and view outputs.
 */
const Terminal = () => {
    const [lines, setLines] = createStore(terminalStore.lines)

    /** @type {HTMLInputElement} */
    let inputRef

    onMount(() => {
        inputRef.focus()
    })

    /**
     * handleKeyDown.
     * @param {KeyboardEvent} e - The keyboard event.
     */
    const handleKeyDown = (e) => {
        console.log('handleKeyDown', e.key)
    }

    /**
     * handleInput.
     * @param {InputEvent} e - The input event.
     */
    const handleInput = (e) => {
        if (!e.data) return

        const currentLine = terminalStore.lines[terminalStore.currentLineIndex]
        const newInput =
            currentLine.input.slice(0, currentLine.cursorPosition) +
            e.data +
            currentLine.input.slice(currentLine.cursorPosition)

        updateCurrentLine({
            ...currentLine,
            input: newInput,
            cursorPosition: currentLine.cursorPosition + 1,
        })
    }

    /**
     * @typedef {import("@gnikolaos/components/terminal/store/terminalStore").Line} Line
     * @param {Line} newLine - The new line to update.
     */
    const updateCurrentLine = (newLine) => {
        const newLines = [...lines]
        newLines[terminalStore.currentLineIndex] = newLine
        setLines(newLines)
    }

    return (
        <div class="font-meslo flex min-h-dvh flex-col bg-black text-slate-100">
            <main id="terminal" class="relative flex-1 overflow-y-auto p-4" onClick={() => inputRef.focus()}>
                <For each={lines}>
                    {(line, index) => (
                        <div class="min-h-5 text-sm leading-normal sm:min-h-6 sm:text-base">
                            <Switch
                                fallback={
                                    <div class="relative">
                                        <div class="absolute inset-0 whitespace-nowrap">
                                            <span class="text-blue-400">{line.prompt.path}</span>
                                            <span
                                                class="ml-2"
                                                classList={{
                                                    'text-green-400': line.prompt.status === 'default',
                                                    'text-red-400': line.prompt.status === 'failure',
                                                }}
                                            >
                                                ❯
                                            </span>
                                        </div>
                                        <div class="break-all whitespace-pre-wrap">
                                            {'\u00A0'.repeat(line.prompt.path.length + 3)}
                                            {renderText(line.input.slice(0, line.cursorPosition))}
                                            <Show when={index() === terminalStore.currentLineIndex}>
                                                <Show
                                                    when={line.input[line.cursorPosition]}
                                                    fallback={
                                                        <div class="inline h-full">
                                                            <span class="inline-block h-[1.2rem] w-[0.6rem] bg-white align-text-bottom" />
                                                        </div>
                                                    }
                                                >
                                                    <span class="inline-flex h-[1.2rem] w-[0.6rem] items-center bg-white align-text-bottom text-black">
                                                        {line.input[line.cursorPosition]}
                                                    </span>
                                                </Show>
                                            </Show>
                                            {renderText(line.input.slice(line.cursorPosition + 1))}
                                        </div>
                                    </div>
                                }
                            >
                                <Match when={line.output.type === 'plain'}>
                                    <div id="terminal-output">{formatContent(line.output.content)}</div>
                                </Match>
                                <Match when={line.output.type === 'markdown'}>
                                    <article
                                        id="terminal-markdown"
                                        class="prose prose-sm prose-stone prose-invert md:prose-base select-text selection:bg-[#00212a] selection:text-green-600"
                                        innerHTML={snarkdown(line.output.content)}
                                    />
                                </Match>
                            </Switch>
                        </div>
                    )}
                </For>

                <input
                    ref={inputRef}
                    id="terminal-input"
                    name="terminal-input"
                    type="text"
                    class="sr-only"
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    autocomplete="off"
                    spellcheck={false}
                />
            </main>
            <TerminalFooter />
        </div>
    )
}

export default Terminal
