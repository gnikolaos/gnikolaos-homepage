import { Marked, Renderer } from 'marked'

/** @typedef {import('../store/terminalStore').OutputContent} OutputContent */

const renderLink = Renderer.prototype.link

const markdown = new Marked({
    gfm: true,
    renderer: {
        link(token) {
            return renderLink.call(this, token).replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
        },
    },
})

const selectable = 'select-text selection:bg-[#00212a] selection:text-green-600'

/**
 * @param {string} content
 * @returns {string}
 */
const toHtml = (content) => /** @type {string} */ (markdown.parse(content, { gfm: true }))

/**
 * @param {{ output: OutputContent }} props
 */
const Output = (props) => (
    <>
        {props.output.kind === 'markdown' ? (
            <article
                class={`prose prose-sm prose-stone prose-invert md:prose-base ${selectable}`}
                // eslint-disable-next-line solid/no-innerhtml
                innerHTML={toHtml(props.output.content)}
            />
        ) : (
            <pre class={`font-meslo break-words whitespace-pre-wrap ${selectable}`}>{props.output.content}</pre>
        )}
    </>
)

export default Output
