import { describe, expect, test } from 'vitest'
import { createRope } from './createRope'

/** @import { RopeStep } from './types' */

/** @type {RopeStep} */
const OPTIONS = {
    anchor: { x: 200, y: 0 },
    anchorLead: { x: 0, y: 0 },
    cableLength: 300,
    plugLength: 20,
    gravity: 2000,
    damping: 0.97,
    internalDamping: 0.3,
    iterations: 24,
    bend: 0.35,
    hold: null,
}

/**
 * @param {number} steps
 * @param {Partial<RopeStep>} [overrides]
 */
const run = (steps, overrides = {}) => {
    const rope = createRope(16, 0.35)
    rope.reset({ x: 0, y: 0 }, OPTIONS.anchor)
    for (let i = 0; i < steps; i += 1) rope.step({ ...OPTIONS, ...overrides }, 1 / 120)
    return rope
}

/** @param {{ x: number, y: number }[]} points */
const measureLength = (points) =>
    points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point.x - points[i].x, point.y - points[i].y), 0)

describe('createRope', () => {
    test('keeps the cable pinned to the anchor', () => {
        expect(run(10).cablePoints().at(-1)).toEqual({ x: 200, y: 0 })
    })

    test('turns the cable towards its lead where it leaves the anchor', () => {
        /** @param {{ x: number, y: number }} anchorLead */
        const exitAngle = (anchorLead) => {
            const [before, anchor] = run(1500, { anchorLead }).cablePoints().slice(-2)
            return (Math.atan2(before.y - anchor.y, before.x - anchor.x) * 180) / Math.PI
        }
        expect(exitAngle({ x: 0, y: 0 })).toBeCloseTo(90, 0)
        expect(exitAngle({ x: -30, y: 30 })).toBeGreaterThan(105)
    })

    test('lets a free plug hang below the anchor, pointing down', () => {
        const rope = run(2000)
        const tip = rope.tip()
        const boot = rope.boot()
        expect(tip.x).toBeCloseTo(200, 0)
        expect(tip.y).toBeGreaterThan(300)
        expect(tip.y).toBeGreaterThan(boot.y)
    })

    test('keeps the cable and plug lengths', () => {
        const rope = run(600)
        expect(measureLength(rope.cablePoints())).toBeGreaterThan(290)
        expect(measureLength(rope.cablePoints())).toBeLessThan(310)
        expect(Math.hypot(rope.boot().x - rope.tip().x, rope.boot().y - rope.tip().y)).toBeCloseTo(20, 0)
    })

    test('seats the plug level at the given tip', () => {
        const rope = run(600, { hold: { kind: 'seat', tip: { x: -100, y: 50 } } })
        expect(rope.tip()).toEqual({ x: -100, y: 50 })
        expect(rope.boot()).toEqual({ x: -80, y: 50 })
    })

    test('holds the grabbed point of the plug and lets it turn', () => {
        const rope = run(600, { hold: { kind: 'grab', point: { x: 0, y: 100 }, fraction: 0.5, align: 0 } })
        const tip = rope.tip()
        const boot = rope.boot()
        expect((tip.x + boot.x) / 2).toBeCloseTo(0, 5)
        expect((tip.y + boot.y) / 2).toBeCloseTo(100, 5)
        expect(boot.x).toBeGreaterThan(tip.x)
    })

    test('shifts without gaining speed', () => {
        const rope = run(3000)
        rope.shift({ x: -40, y: 10 }, { x: 60, y: 0 })
        expect(rope.maxSpeed()).toBeCloseTo(0, 9)
        expect(rope.cablePoints().at(-1)).toEqual({ x: 260, y: 0 })
    })

    test('stops all motion in place', () => {
        const rope = run(20)
        const tip = rope.tip()
        rope.stop()
        expect(rope.maxSpeed()).toBe(0)
        expect(rope.tip()).toEqual(tip)
    })

    test('comes to rest', () => {
        expect(run(3000).maxSpeed()).toBeLessThan(0.01)
    })
})
