/**
 * @param {string} name
 * @returns {string}
 */
const quoteShellWord = (name) => (/^[\w.\-/]+$/.test(name) ? name : `'${name.replace(/'/g, `'\\''`)}'`)

/**
 * @param {string} segment
 * @returns {string}
 */
const decodeSegment = (segment) => {
    try {
        return decodeURIComponent(segment)
    } catch {
        return segment
    }
}

/**
 * Plans the shell lines that open a deep-linked content path: `cd` into its directory, then `cat` a file or `ls`.
 * @param {string | undefined} path
 * @returns {string[]}
 */
const planDeepLink = (path) => {
    const segments = (path ?? '')
        .split('/')
        .map(decodeSegment)
        .filter((segment) => segment && segment !== '.' && segment !== '..')
    if (segments.length === 0) return []
    const lastSegment = /** @type {string} */ (segments.at(-1))
    const isFile = lastSegment.endsWith('.md')
    const dirSegments = isFile ? segments.slice(0, -1) : segments
    const commandLines = dirSegments.length > 0 ? [`cd ~/${quoteShellWord(dirSegments.join('/'))}`] : []
    commandLines.push(isFile ? `cat ${quoteShellWord(lastSegment)}` : 'ls')
    return commandLines
}

export { planDeepLink }
