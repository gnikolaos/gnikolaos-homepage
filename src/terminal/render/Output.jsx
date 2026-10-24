import { createMemo, Index, Show } from 'solid-js'
import { Marked, Renderer } from 'marked'
import clsx from 'clsx'
import { isStyled, parseAnsi } from '../shell/ansi'

/** @typedef {import('../store/terminalStore').OutputContent} OutputContent */
/** @typedef {import('../shell/ansi').Span} Span */
/** @typedef {import('../shell/ansi').Color} Color */

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

/** @type {Record<Color, string>} */
const colorClasses = {
    red: 'text-red-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    magenta: 'text-fuchsia-400',
    cyan: 'text-cyan-400',
    white: 'text-white',
}

/**
 * @param {Span} span
 * @returns {string}
 */
const spanClass = (span) =>
    clsx(span.color && colorClasses[span.color], span.bold && 'font-bold', span.underline && 'underline')

/**
 * @param {string} content
 * @returns {string}
 */
const toHtml = (content) => /** @type {string} */ (markdown.parse(content, { gfm: true }))

/**
 * @param {{ content: string }} props
 */
const Plain = (props) => {
    const spans = createMemo(() => parseAnsi(props.content))
    return (
        <pre class={`font-meslo break-words whitespace-pre-wrap ${selectable}`}>
            <Index each={spans()}>
                {(span) => (
                    <Show when={isStyled(span())} fallback={span().text}>
                        <span class={spanClass(span())}>{span().text}</span>
                    </Show>
                )}
            </Index>
        </pre>
    )
}

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
            <Plain content={props.output.content} />
        )}
    </>
)

export default Output
