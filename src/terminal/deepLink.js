/**
 * @param {string} name
 * @returns {string}
 */
const quote = (name) => (/^[\w.\-/]+$/.test(name) ? name : `'${name.replace(/'/g, `'\\''`)}'`)

/**
 * @param {string} segment
 * @returns {string}
 */
const decode = (segment) => {
    try {
        return decodeURIComponent(segment)
    } catch {
        return segment
    }
}

/**
 * @param {string | undefined} path
 * @returns {string[]}
 */
const planDeepLink = (path) => {
    const segments = (path ?? '')
        .split('/')
        .map(decode)
        .filter((segment) => segment && segment !== '.' && segment !== '..')
    if (segments.length === 0) return []
    const last = /** @type {string} */ (segments.at(-1))
    const isFile = last.endsWith('.md')
    const dirs = isFile ? segments.slice(0, -1) : segments
    const lines = dirs.length > 0 ? [`cd ~/${quote(dirs.join('/'))}`] : []
    lines.push(isFile ? `cat ${quote(last)}` : 'ls')
    return lines
}

export { planDeepLink }
