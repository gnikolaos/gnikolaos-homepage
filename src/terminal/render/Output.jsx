import PlainOutput from './PlainOutput'
import { renderMarkdown } from './renderMarkdown'

/** @import { OutputContent } from '../store/types' */

/**
 * Renders an output block as markdown or plain text.
 * @param {{ output: OutputContent }} props
 */
const Output = (props) => (
    <>
        {props.output.kind === 'markdown' ? (
            <article
                class="prose prose-sm prose-stone prose-invert md:prose-base selectable-text"
                // eslint-disable-next-line solid/no-innerhtml
                innerHTML={renderMarkdown(props.output.content)}
            />
        ) : (
            <PlainOutput content={props.output.content} />
        )}
    </>
)

export default Output
