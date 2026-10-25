/** @import { Point } from './types' */

/** @param {number} value */
const round = (value) => Math.round(value * 100) / 100

/**
 * Builds a smooth SVG path through every point, converting the Catmull-Rom spline into cubic Bezier segments.
 * @param {Point[]} points
 * @returns {string}
 */
const buildRopePath = (points) => {
    if (points.length === 0) return ''
    const [first] = points
    let d = `M${round(first.x)} ${round(first.y)}`
    for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(points.length - 1, i + 2)]
        const c1x = p1.x + (p2.x - p0.x) / 6
        const c1y = p1.y + (p2.y - p0.y) / 6
        const c2x = p2.x - (p3.x - p1.x) / 6
        const c2y = p2.y - (p3.y - p1.y) / 6
        d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2.x)} ${round(p2.y)}`
    }
    return d
}

export { buildRopePath }
