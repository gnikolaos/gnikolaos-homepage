import { For } from 'solid-js'

/** @import { Action } from '../editor/types' */

/** @type {readonly { label: string, ariaLabel: string, action: Action }[]} */
const TOUCH_KEYS = [
    { label: 'help', ariaLabel: 'Run help', action: { type: 'run', line: 'help' } },
    { label: 'ls', ariaLabel: 'Run ls', action: { type: 'run', line: 'ls' } },
    { label: 'cat', ariaLabel: 'Type cat', action: { type: 'insert', text: 'cat ' } },
    { label: 'clear', ariaLabel: 'Clear the screen', action: { type: 'clearScreen' } },
    { label: '↑', ariaLabel: 'Previous command', action: { type: 'historyPrev' } },
    { label: '↓', ariaLabel: 'Next command', action: { type: 'historyNext' } },
    { label: 'Tab', ariaLabel: 'Complete', action: { type: 'complete' } },
]

/**
 * Renders the row of terminal keys shown on touch devices, dispatching each key's action without taking focus.
 * @param {{ dispatch: (action: Action) => void, disabled: boolean }} props
 */
const TouchBar = (props) => (
    <div
        role="toolbar"
        aria-label="Terminal keys"
        class="font-meslo hidden w-full shrink-0 gap-1 overflow-x-auto bg-[#00212a] p-1 text-sm pointer-coarse:flex"
        onPointerDown={(e) => e.preventDefault()}
    >
        <For each={TOUCH_KEYS}>
            {(key) => (
                <button
                    type="button"
                    aria-label={key.ariaLabel}
                    class="min-h-11 shrink-0 touch-manipulation rounded-sm px-3 text-gray-400 active:bg-gray-400 active:text-black disabled:opacity-40"
                    disabled={props.disabled}
                    onClick={() => props.dispatch(key.action)}
                >
                    {key.label}
                </button>
            )}
        </For>
    </div>
)

export default TouchBar
