import TerminalFooter from '@gnikolaos/components/terminal/TerminalFooter'
import { onMount } from 'solid-js'

/**
 * Terminal route simulates a Unix-like "command line" interface.
 * Allows users to input commands and view outputs.
 */
const Terminal = () => {
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
        console.log('handleInput', e)
    }

    return (
        <div class="flex min-h-dvh flex-col bg-black font-mono text-slate-100">
            <main id="terminal" class="relative flex-1 overflow-y-auto p-4" onClick={() => inputRef.focus()}>
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
