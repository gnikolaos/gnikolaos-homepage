/**
 * Tells whether the document has a non-empty text selection.
 * @returns {boolean}
 */
const hasTextSelection = () => {
    const selection = window.getSelection()
    return selection !== null && !selection.isCollapsed
}

export { hasTextSelection }
