import { Marked, Renderer } from 'marked'

const renderDefaultLink = Renderer.prototype.link

const markdown = new Marked({
    gfm: true,
    renderer: {
        link(token) {
            return renderDefaultLink.call(this, token).replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
        },
    },
})

/**
 * Renders GitHub-flavoured markdown to HTML, opening links in a new tab.
 * @param {string} content
 * @returns {string}
 */
const renderMarkdown = (content) => /** @type {string} */ (markdown.parse(content, { gfm: true }))

export { renderMarkdown }
