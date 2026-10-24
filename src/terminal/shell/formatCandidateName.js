/**
 * Formats a completion candidate path as its last segment, keeping the trailing slash of a directory.
 * @param {string} candidate
 * @returns {string}
 */
const formatCandidateName = (candidate) => {
    const isDir = candidate.endsWith('/')
    const path = isDir ? candidate.slice(0, -1) : candidate
    const name = path.slice(path.lastIndexOf('/') + 1)
    return isDir ? name + '/' : name
}

export { formatCandidateName }
