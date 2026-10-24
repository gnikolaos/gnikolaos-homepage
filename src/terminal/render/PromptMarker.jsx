import { createEffect, createSignal, onCleanup } from 'solid-js'

/** @typedef {import('../store/terminalStore').PromptStatus} PromptStatus */

const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
const SPINNER_DELAY_MS = 150
const SPINNER_INTERVAL_MS = 80

/**
 * @param {() => PromptStatus} status
 * @returns {() => number | null}
 */
const createSpinnerFrame = (status) => {
    const [frame, setFrame] = createSignal(/** @type {number | null} */ (null))
    createEffect(() => {
        setFrame(null)
        if (status() !== 'running') return
        /** @type {ReturnType<typeof setInterval> | undefined} */
        let interval
        const timeout = setTimeout(() => {
            setFrame(0)
            interval = setInterval(() => setFrame((i) => ((i ?? 0) + 1) % SPINNER_FRAMES.length), SPINNER_INTERVAL_MS)
        }, SPINNER_DELAY_MS)
        onCleanup(() => {
            clearTimeout(timeout)
            clearInterval(interval)
        })
    })
    return frame
}

/**
 * @param {{ status: PromptStatus }} props
 */
const PromptMarker = (props) => {
    const frame = createSpinnerFrame(() => props.status)
    const glyph = () => (frame() === null ? '❯' : SPINNER_FRAMES[/** @type {number} */ (frame())])
    return (
        <span
            class="inline-block w-[1ch] text-center"
            classList={{ 'text-green-400': props.status !== 'error', 'text-red-400': props.status === 'error' }}
        >
            {glyph()}
        </span>
    )
}

export default PromptMarker
