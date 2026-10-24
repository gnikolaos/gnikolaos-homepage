import { createSpinnerFrame } from './createSpinnerFrame'
import { SPINNER } from './SPINNER'

/** @import { PromptStatus } from '../store/types' */

/**
 * Renders the prompt marker, coloured by status, as a spinner while the command runs.
 * @param {{ status: PromptStatus, running: boolean }} props
 */
const PromptMarker = (props) => {
    const frame = createSpinnerFrame(() => props.running)
    const glyph = () => (frame() === null ? '❯' : SPINNER.FRAMES[/** @type {number} */ (frame())])
    return (
        <span
            class="inline-block w-[1ch] text-center"
            classList={{ 'text-green-400': props.status === 'ok', 'text-red-400': props.status === 'error' }}
        >
            {glyph()}
        </span>
    )
}

export default PromptMarker
