import { describe, expect, test } from 'vitest'
import { buildRopePath } from './buildRopePath'

describe('buildRopePath', () => {
    test('returns an empty path for no points', () => {
        expect(buildRopePath([])).toBe('')
    })

    test('draws a straight line through collinear points', () => {
        const path = buildRopePath([
            { x: 0, y: 0 },
            { x: 6, y: 0 },
            { x: 12, y: 0 },
        ])
        expect(path).toBe('M0 0 C1 0 4 0 6 0 C8 0 11 0 12 0')
    })

    test('emits one curve per segment ending on each point', () => {
        const path = buildRopePath([
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 0 },
            { x: 30, y: 10 },
        ])
        expect(path.match(/C/g)).toHaveLength(3)
        expect(path.endsWith(' 30 10')).toBe(true)
    })
})
