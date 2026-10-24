import { createEffect, createSignal, onCleanup, Show } from 'solid-js'

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
const Indicator = (props) => {
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

/**
 * @param {{ input: string, cursor: number }} props
 */
const InputWithCursor = (props) => {
    const charAtCursor = () => props.input[props.cursor]
    return (
        <>
            {props.input.slice(0, props.cursor)}
            <Show
                when={charAtCursor()}
                fallback={<span class="inline-block h-[1.2em] w-[0.6em] bg-slate-100 align-text-bottom" />}
            >
                <span class="bg-slate-100 text-black">{charAtCursor()}</span>
            </Show>
            {props.input.slice(props.cursor + 1)}
        </>
    )
}

/**
 * @param {{ path: string, status: PromptStatus, input: string, cursor?: number }} props
 */
const Prompt = (props) => (
    <div class="break-all whitespace-pre-wrap">
        <span class="text-blue-400">{props.path}</span> <Indicator status={props.status} />{' '}
        <Show when={props.cursor !== undefined} fallback={props.input}>
            <InputWithCursor input={props.input} cursor={/** @type {number} */ (props.cursor)} />
        </Show>
    </div>
)

export default Prompt
