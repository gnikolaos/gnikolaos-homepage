import { createEffect, createSignal, onCleanup } from 'solid-js'
import { SPINNER } from './SPINNER'

/**
 * Creates a signal of the current spinner frame index, null until `running` has held for the spinner delay.
 * @param {() => boolean} running
 * @returns {() => number | null}
 */
const createSpinnerFrame = (running) => {
    const [frame, setFrame] = createSignal(/** @type {number | null} */ (null))
    createEffect(() => {
        setFrame(null)
        if (!running()) return
        /** @type {ReturnType<typeof setInterval> | undefined} */
        let interval
        const timeout = setTimeout(() => {
            setFrame(0)
            interval = setInterval(() => setFrame((i) => ((i ?? 0) + 1) % SPINNER.FRAMES.length), SPINNER.INTERVAL_MS)
        }, SPINNER.DELAY_MS)
        onCleanup(() => {
            clearTimeout(timeout)
            clearInterval(interval)
        })
    })
    return frame
}

export { createSpinnerFrame }
