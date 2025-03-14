/**
 * Render text with preserved whitespace.
 * @param {string} text - The text to render.
 * @returns {Array<string>} The rendered text.
 */
const renderText = (text) => {
    if (typeof text !== 'string') text = ''

    const splitText = text.split('')
    const textWithWhitespaceTransformed = splitText.map((char) => (char === ' ' ? '\u00A0' : char))

    return textWithWhitespaceTransformed
}

/**
 * Format content for rendering.
 * @param {string} content - The content to format.
 * @returns {Array<import('solid-js').JSX.Element>} An array of content formatted JSX elements.
 */
const formatContent = (content) => {
    if (typeof content !== 'string') content = ''
    const lines = content.split('\n')
    return lines.map((line, index) => (
        <>
            {line}
            {index < lines.length - 1 && <br />}
        </>
    ))
}

export { renderText, formatContent }
