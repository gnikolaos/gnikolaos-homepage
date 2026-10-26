/** @import { Point, RopeHold, RopeStep } from './types' */

const TIP = 0
const BOOT = 1
/** How many points from the anchor the anchor lead turns. */
const LEAD_POINTS = 8

/**
 * Creates a Verlet rope of `count` points (at least 4) with a rigid plug at its free end. Point 0 is the plug tip,
 * point 1 the plug boot, and the last point is pinned to the anchor. The cable is pushed to leave the anchor along
 * `anchorLead`, like a cable coming out of a ceiling fitting; the turn is applied at the anchor and spread along the
 * cable by its bending stiffness, so it never forms a corner. The plug is heavier than the cable, so it pulls the
 * cable straight while the cable can still swing and turn it.
 * @param {number} count
 * @param {number} plugWeight - Inverse mass of the plug points relative to the cable points (1).
 */
const createRope = (count, plugWeight) => {
    const x = new Float64Array(count)
    const y = new Float64Array(count)
    const prevX = new Float64Array(count)
    const prevY = new Float64Array(count)
    const weight = new Float64Array(count).fill(1)
    const velocityX = new Float64Array(count)
    const velocityY = new Float64Array(count)
    const last = count - 1
    weight[TIP] = plugWeight
    weight[BOOT] = plugWeight
    weight[last] = 0

    /**
     * Pulls points `i` and `j` towards `rest` apart, split by their weights.
     * @param {number} i
     * @param {number} j
     * @param {number} rest
     * @param {number} stiffness
     * @param {boolean} pushOnly - Only push the points apart, never pull them together.
     */
    const constrain = (i, j, rest, stiffness, pushOnly) => {
        const total = weight[i] + weight[j]
        if (total === 0) return
        const dx = x[j] - x[i]
        const dy = y[j] - y[i]
        const distance = Math.hypot(dx, dy) || 1
        if (pushOnly && distance >= rest) return
        const correction = ((distance - rest) / distance) * (stiffness / total)
        x[i] += dx * correction * weight[i]
        y[i] += dy * correction * weight[i]
        x[j] -= dx * correction * weight[j]
        y[j] -= dy * correction * weight[j]
    }

    /**
     * Places the plug with its tip at `tip`, rotated by `angle`.
     * @param {Point} tip
     * @param {number} angle
     * @param {number} length
     */
    const placePlug = (tip, angle, length) => {
        x[TIP] = tip.x
        y[TIP] = tip.y
        x[BOOT] = tip.x + Math.cos(angle) * length
        y[BOOT] = tip.y + Math.sin(angle) * length
    }

    /**
     * @param {RopeHold | null} hold
     * @param {number} plugLength
     */
    const applyHold = (hold, plugLength) => {
        if (!hold) return
        if (hold.kind === 'seat') {
            placePlug(hold.tip, 0, plugLength)
            return
        }
        const angle = Math.atan2(y[BOOT] - y[TIP], x[BOOT] - x[TIP])
        const aligned = angle * (1 - hold.align)
        const along = hold.fraction * plugLength
        placePlug(
            { x: hold.point.x - Math.cos(aligned) * along, y: hold.point.y - Math.sin(aligned) * along },
            aligned,
            plugLength,
        )
    }

    /**
     * Lays the rope out in a straight line from `tip` to `anchor`, at rest.
     * @param {Point} tip
     * @param {Point} anchor
     */
    const reset = (tip, anchor) => {
        for (let i = 0; i < count; i += 1) {
            const t = i / last
            x[i] = prevX[i] = tip.x + (anchor.x - tip.x) * t
            y[i] = prevY[i] = tip.y + (anchor.y - tip.y) * t
        }
    }

    /**
     * Advances the simulation by `dt` seconds.
     * @param {RopeStep} options
     * @param {number} dt
     */
    const step = (
        { anchor, anchorLead, cableLength, plugLength, gravity, damping, internalDamping, iterations, bend, hold },
        dt,
    ) => {
        const drop = gravity * dt * dt
        for (let i = 0; i < count; i += 1) {
            velocityX[i] = x[i] - prevX[i]
            velocityY[i] = y[i] - prevY[i]
        }
        for (let i = 0; i < last; i += 1) {
            // Internal damping pulls each point's velocity towards its neighbours', calming waves along the cable
            // without slowing its overall swing.
            const before = Math.max(0, i - 1)
            const vx = velocityX[i] + ((velocityX[before] + velocityX[i + 1]) / 2 - velocityX[i]) * internalDamping
            const vy = velocityY[i] + ((velocityY[before] + velocityY[i + 1]) / 2 - velocityY[i]) * internalDamping
            prevX[i] = x[i]
            prevY[i] = y[i]
            x[i] += vx * damping
            y[i] += vy * damping + drop
        }

        const seated = hold?.kind === 'seat'
        weight[TIP] = weight[BOOT] = seated ? 0 : plugWeight
        const segment = cableLength / (last - 1)
        const leadLength = Math.hypot(anchorLead.x, anchorLead.y)
        // A fixed point behind the anchor, opposite the lead; keeping the cable straight through it points the cable
        // along the lead where it leaves the anchor.
        const behindX = anchor.x - anchorLead.x
        const behindY = anchor.y - anchorLead.y
        x[last] = prevX[last] = anchor.x
        y[last] = prevY[last] = anchor.y
        for (let pass = 0; pass < iterations; pass += 1) {
            constrain(TIP, BOOT, plugLength, 1, false)
            for (let i = BOOT; i < last; i += 1) constrain(i, i + 1, segment, 1, false)
            constrain(TIP, BOOT + 1, plugLength + segment, 1, true)
            for (let i = BOOT; i < last - 1; i += 1) constrain(i, i + 2, segment * 2, bend, true)
            if (leadLength > 0) {
                // Spread the turn over the first few points from the anchor, weakening with distance, so the cable
                // bends gradually instead of flicking at the anchor.
                for (let k = 1; k <= LEAD_POINTS && last - k > BOOT; k += 1) {
                    const i = last - k
                    const dx = x[i] - behindX
                    const dy = y[i] - behindY
                    const distance = Math.hypot(dx, dy) || 1
                    const push = Math.max(0, leadLength + segment * k - distance) * bend * (1 - (k - 1) / LEAD_POINTS)
                    x[i] += (dx / distance) * push
                    y[i] += (dy / distance) * push
                }
            }
            applyHold(hold, plugLength)
        }
        if (seated) {
            prevX[TIP] = x[TIP]
            prevY[TIP] = y[TIP]
            prevX[BOOT] = x[BOOT]
            prevY[BOOT] = y[BOOT]
        }
    }

    /**
     * Largest distance any point moved during the last step.
     * @returns {number}
     */
    const measureMaxSpeed = () => {
        let max = 0
        for (let i = 0; i < count; i += 1) max = Math.max(max, Math.abs(x[i] - prevX[i]), Math.abs(y[i] - prevY[i]))
        return max
    }

    /**
     * @param {number} i
     * @returns {Point}
     */
    const readPoint = (i) => ({ x: x[i], y: y[i] })

    /**
     * The cable points from the plug boot to the anchor.
     * @returns {Point[]}
     */
    const listCablePoints = () => Array.from({ length: count - BOOT }, (_, i) => readPoint(i + BOOT))

    /**
     * Moves the rope without giving it any speed: the plug tip moves by `tipDelta`, the anchor by `anchorDelta`, and
     * the points between by a blend of the two. Used when the layout changes under the rope, such as on resize.
     * @param {Point} tipDelta
     * @param {Point} anchorDelta
     */
    const shift = (tipDelta, anchorDelta) => {
        for (let i = 0; i < count; i += 1) {
            const t = i / last
            const dx = tipDelta.x + (anchorDelta.x - tipDelta.x) * t
            const dy = tipDelta.y + (anchorDelta.y - tipDelta.y) * t
            x[i] += dx
            y[i] += dy
            prevX[i] += dx
            prevY[i] += dy
        }
    }

    /** Stops all motion, leaving the rope where it is. */
    const stop = () => {
        prevX.set(x)
        prevY.set(y)
    }

    return {
        reset,
        step,
        shift,
        stop,
        measureMaxSpeed,
        readTip: () => readPoint(TIP),
        readBoot: () => readPoint(BOOT),
        listCablePoints,
    }
}

export { createRope }
