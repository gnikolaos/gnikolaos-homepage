import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js'
import { createRope } from '@gnikolaos/cable/createRope'
import { buildRopePath } from '@gnikolaos/cable/buildRopePath'

/** @import { Point, RopeHold } from '@gnikolaos/cable/types' */

const POINT_COUNT = 40
const STEP_SECONDS = 1 / 120
const MAX_STEPS_PER_FRAME = 6
const SETTLE_STEPS = 600
/** Steps run at once to fit a seated cable to a new layout. */
const LAYOUT_SETTLE_STEPS = 120
/** Gravity in px/s². */
const GRAVITY = 2200
/** Velocity kept per step (air drag); lower is calmer. */
const DAMPING = 0.978
/** How strongly neighbouring cable points match velocities; calms waves without killing the swing. */
const INTERNAL_DAMPING = 0.4
const ITERATIONS = 24
const BEND = 1
/** The plug is about three times heavier than a cable point. */
const PLUG_WEIGHT = 0.35
/** Cable length when the plug hangs free, in unscaled px. */
const REST_LENGTH_PX = 35
/**
 * Cable length while seated, relative to the straight distance to the anchor. 0.99 gives a shallow hang (about 40px on
 * a desktop width); lower pulls it tighter, higher lets it sag towards the middle of the page.
 */
const SEATED_RATIO = 0.99
/** While held, the cable keeps just this much more length than the straight distance to the plug. */
const TAUT_RATIO = 1.03
/** How fast the cable pays out when it needs more length and nobody is pulling, in unscaled px/s. */
const FEED_SPEED_PX = 300
/** How fast the cable reels back in once released, in unscaled px/s, plus `REEL_RATE` per second of the excess. */
const REEL_SPEED_PX = 280
/**
 * Extra reel speed per pixel of cable still to take in, per second: a long, slack cable is taken up quickly so the
 * plug does not swing far down the page, slowing as it nears its rest length so it is not flung past the anchor.
 */
const REEL_RATE = 4
/** Air drag while the cable reels in, like a reel's friction; stops the shortening cable from slinging the plug. */
const REEL_DAMPING = 0.93
/** The anchor sits just above the top edge, mirroring the socket: as far from the right edge as the socket is from the left. */
const ANCHOR_ABOVE_PX = 8
/**
 * While seated, the cable is turned to leave the anchor along the direction (`ANCHOR_LEAD_X_PX`, `ANCHOR_LEAD_Y_PX`),
 * down and to the left, in unscaled px. It then curves smoothly into the span instead of climbing steeply into the
 * corner, so the dip looks even. A free plug hangs straight from the anchor, so the turn eases in and out with the
 * connection.
 */
const ANCHOR_LEAD_X_PX = -20
/** Downward part of the anchor lead direction, in unscaled px; see `ANCHOR_LEAD_X_PX`. */
const ANCHOR_LEAD_Y_PX = 30
/** How fast the anchor turn eases in or out, as a fraction per second. */
const ANCHOR_LEAD_SPEED = 3
/** How deep the plug tip sits inside the socket, in unscaled px. */
const SOCKET_DEPTH_PX = 5
/**
 * The plug moves this many times as far as the pointer, so the socket is reached with less movement. Pulling a seated
 * plug out keeps it 1:1.
 */
const DRAG_GAIN = 1.4
/** How long the keyboard takes to carry the plug to the socket, in ms. */
const CARRY_MS = 700
/** Within this distance of the socket the plug clicks in, in unscaled px. */
const SNAP_RADIUS_PX = 14
/** A dragged plug this close to the socket is taken from the pointer and drawn in, in unscaled px. */
const MAGNET_RADIUS_PX = 36
/** How long the plug takes to be drawn in from the magnet radius, in ms. */
const MAGNET_CARRY_MS = 160
/** After a pull-out, the plug must get this far from the socket before it can click in again, in unscaled px. */
const REARM_RADIUS_PX = 50
/** Within this distance the plug starts turning level to meet the socket, in unscaled px. */
const ALIGN_RADIUS_PX = 120
/** A seated plug pops out once pulled this far, in unscaled px; until then it barely moves. */
const PULL_OUT_PX = 40
const PULL_RESISTANCE = 0.2
/** Padding around the plug inside its focus ring in screen px, matching the page's icon links. */
const FOCUS_PADDING_PX = 8
/** Cable thickness in unscaled px, matching the plug boot. */
const THICKNESS_PX = 4
/** Below this per-step movement (px) the rope counts as resting. */
const REST_SPEED = 0.01
const REST_STEPS = 60

/** @param {Point} a @param {Point} b */
const measureDistance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

/** @param {Point} a @param {Point} b @param {number} t */
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

const playCableSound = () => {
    const sound = new Audio('/audio/plug.mp3')
    sound.volume = 0.4
    sound.play().catch(() => {})
}

/**
 * The RJ45 cable: a rope hanging from above the top right corner with the plug as its heavy free end. Drag the plug
 * into the socket to connect, pull it out past a threshold to disconnect.
 * @param {object} props
 * @param {HTMLElement | undefined} props.socket - The socket element the plug seats into (on its right edge).
 * @param {boolean} props.connected
 * @param {(connected: boolean) => void} props.onConnectedChange
 */
const Cable = (props) => {
    const rope = createRope(POINT_COUNT, PLUG_WEIGHT)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const [path, setPath] = createSignal('')
    const [plug, setPlug] = createSignal({ x: 0, y: 0, angle: 0, scale: 1 })
    const [isHeld, setIsHeld] = createSignal(false)
    /** @type {HTMLDivElement | undefined} */
    let plugRef
    /** @type {HTMLDivElement | undefined} */
    let headRef
    /** @type {SVGSVGElement | undefined} */
    let svgRef

    /**
     * A plug being held, by a pointer or by a keyboard carry (`pointerId` -1).
     * @typedef {object} Grab
     * @property {number} pointerId
     * @property {Point} target - Where the held point of the plug is heading, after the drag gain.
     * @property {Point} lastTarget - `target` at the previous frame, to interpolate steps between.
     * @property {Point} client - The last pointer position on screen, before the drag gain.
     * @property {number} gain - How many times as far as the pointer the plug moves.
     * @property {Point} offset - From the held point on the plug to the pointer.
     * @property {number} fraction - Where along the plug it is held, from 0 (tip) to 1 (boot).
     * @property {boolean} canSnap - Whether the plug may click into the socket; off after a pull-out until it is rearmed.
     */

    /**
     * A carry of the plug to the socket, from `from`, started at `start` and lasting `duration` (ms).
     * @typedef {{ from: Point, start: number, duration: number }} Carry
     */

    /** @type {Grab | null} */
    let grab = null
    /**
     * A carry in progress (a keyboard connect, or a drag drawn in by the socket): the plug is held at its middle and
     * carried from `from` to the socket.
     * @type {Carry | null}
     */
    let carry = null
    let cableLength = 0
    /** How far the anchor turn has eased in, from 0 (free) to 1 (seated). */
    let leadMix = 0
    let frame = 0
    let lastTime = 0
    let accumulator = 0
    let restingSteps = 0
    /** @type {Layout | null} */
    let lastLayout = null

    const measure = () => {
        if (!props.socket || !headRef || !svgRef) return null
        const rect = props.socket.getBoundingClientRect()
        const scale = rect.width / props.socket.offsetWidth
        const origin = svgRef.getBoundingClientRect()
        return {
            scale,
            /** Where the cable's layers are positioned from, on screen; the rope itself works in screen coordinates. */
            origin: { x: origin.left, y: origin.top },
            socket: { x: rect.right - SOCKET_DEPTH_PX * scale, y: rect.top + rect.height / 2 },
            anchor: { x: window.innerWidth - rect.left, y: -ANCHOR_ABOVE_PX },
            plugLength: headRef.offsetWidth * scale,
        }
    }

    /** @typedef {NonNullable<ReturnType<typeof measure>>} Layout */

    const releaseGrab = () => {
        if (grab && plugRef.hasPointerCapture(grab.pointerId)) plugRef.releasePointerCapture(grab.pointerId)
        grab = null
        carry = null
        setIsHeld(false)
    }

    /**
     * Takes the plug, from the pointer if it is dragged, and carries it by its middle into the socket.
     * @param {number} duration - In ms.
     */
    const startCarry = (duration) => {
        if (grab && plugRef.hasPointerCapture(grab.pointerId)) plugRef.releasePointerCapture(grab.pointerId)
        const middle = lerp(rope.readTip(), rope.readBoot(), 0.5)
        grab = {
            pointerId: -1,
            target: middle,
            lastTarget: middle,
            client: middle,
            gain: 1,
            offset: { x: 0, y: 0 },
            fraction: 0.5,
            canSnap: true,
        }
        carry = { from: middle, start: performance.now(), duration }
        setIsHeld(false)
    }

    /**
     * Decides how the plug is held for this step, connecting or disconnecting as the plug crosses a threshold.
     * @param {Layout} layout
     * @param {Point} target
     * @returns {RopeHold | null}
     */
    const resolveHold = (layout, target) => {
        if (grab && props.connected) {
            const heldTipX = target.x - grab.offset.x - grab.fraction * layout.plugLength
            const pull = Math.max(0, heldTipX - layout.socket.x)
            if (pull < PULL_OUT_PX * layout.scale) {
                return { kind: 'seat', tip: { x: layout.socket.x + pull * PULL_RESISTANCE, y: layout.socket.y } }
            }
            grab.canSnap = false
            props.onConnectedChange(false)
            playCableSound()
        }
        if (grab) {
            const point = { x: target.x - grab.offset.x, y: target.y - grab.offset.y }
            const tip = rope.readTip()
            const gap = measureDistance(tip, layout.socket)
            if (gap > REARM_RADIUS_PX * layout.scale) grab.canSnap = true
            if (grab.canSnap && gap < SNAP_RADIUS_PX * layout.scale) {
                releaseGrab()
                props.onConnectedChange(true)
                playCableSound()
                return { kind: 'seat', tip: layout.socket }
            }
            const align = Math.max(0, 1 - gap / (ALIGN_RADIUS_PX * layout.scale)) * 0.5
            return { kind: 'grab', point, fraction: grab.fraction, align }
        }
        if (props.connected) return { kind: 'seat', tip: layout.socket }
        return null
    }

    /**
     * Pays the cable out or reels it in. While held it stays close to taut, paying out at once when the plug is pulled
     * past its reach and otherwise easing in or out, so grabbing a hanging plug drops no slack and dragging builds
     * none up. Returns the length the cable is heading for.
     * @param {Layout} layout
     * @param {boolean} isSeated
     * @param {boolean} instant - Jump straight to the target (reduced motion).
     */
    const updateCableLength = (layout, isSeated, instant) => {
        const reach = measureDistance(layout.anchor, rope.readBoot())
        const rest = REST_LENGTH_PX * layout.scale
        const seated = Math.max(rest, reach * SEATED_RATIO)
        if (grab && reach > cableLength) cableLength = reach
        const target = grab ? Math.max(rest, reach * TAUT_RATIO) : isSeated ? seated : rest
        const speed =
            (target > cableLength
                ? FEED_SPEED_PX * layout.scale
                : REEL_SPEED_PX * layout.scale + (cableLength - target) * REEL_RATE) * STEP_SECONDS
        cableLength = instant
            ? target
            : target > cableLength
              ? Math.min(target, cableLength + speed)
              : Math.max(target, cableLength - speed)
        return target
    }

    /**
     * Advances the rope by one fixed step.
     * @param {Layout} layout
     * @param {Point} target
     * @param {boolean} instant - Feed or reel the cable in at once (reduced motion).
     */
    const advance = (layout, target, instant) => {
        const hold = resolveHold(layout, target)
        const isSeated = hold?.kind === 'seat'
        const leadTarget = isSeated ? 1 : 0
        const leadStep = ANCHOR_LEAD_SPEED * STEP_SECONDS
        leadMix = instant ? leadTarget : Math.min(leadMix + leadStep, Math.max(leadMix - leadStep, leadTarget))
        const lead = {
            x: ANCHOR_LEAD_X_PX * layout.scale * leadMix,
            y: ANCHOR_LEAD_Y_PX * layout.scale * leadMix,
        }
        const targetLength = updateCableLength(layout, isSeated, instant)
        const isReeling = !grab && cableLength > targetLength
        rope.step(
            {
                anchor: layout.anchor,
                anchorLead: lead,
                cableLength,
                plugLength: layout.plugLength,
                gravity: GRAVITY,
                damping: isReeling ? REEL_DAMPING : DAMPING,
                internalDamping: INTERNAL_DAMPING,
                iterations: ITERATIONS,
                bend: BEND,
                hold,
            },
            STEP_SECONDS,
        )
        const isResting =
            rope.measureMaxSpeed() < REST_SPEED && cableLength === targetLength && leadMix === leadTarget && !grab
        restingSteps = isResting ? restingSteps + 1 : 0
    }

    /** @param {Layout} layout */
    const draw = (layout) => {
        const tip = rope.readTip()
        const boot = rope.readBoot()
        const { origin } = layout
        setPlug({
            x: tip.x - origin.x,
            y: tip.y - origin.y,
            angle: Math.atan2(boot.y - tip.y, boot.x - tip.x),
            scale: layout.scale,
        })
        setPath(
            buildRopePath(rope.listCablePoints().map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }))),
        )
    }

    /**
     * Carries the rope along when the socket or anchor moves under it (resize, rotation), so the layout change does not
     * set it swinging. A held plug stays with the pointer instead.
     * @param {Layout} layout
     */
    const followLayout = (layout) => {
        const previous = lastLayout
        lastLayout = layout
        if (!previous || grab) return
        const anchorDelta = { x: layout.anchor.x - previous.anchor.x, y: layout.anchor.y - previous.anchor.y }
        const socketDelta = { x: layout.socket.x - previous.socket.x, y: layout.socket.y - previous.socket.y }
        const tipDelta = props.connected ? socketDelta : anchorDelta
        const isUnchanged =
            layout.scale === previous.scale &&
            anchorDelta.x === 0 &&
            anchorDelta.y === 0 &&
            tipDelta.x === 0 &&
            tipDelta.y === 0
        if (isUnchanged) return
        rope.shift(tipDelta, anchorDelta)
        updateCableLength(layout, props.connected, true)
        // A seated cable's sag depends on the span, and a new scale changes the cable and plug size, so let the rope
        // settle into its new shape at once rather than drifting there.
        if (props.connected || layout.scale !== previous.scale) {
            for (let i = 0; i < LAYOUT_SETTLE_STEPS; i += 1) advance(layout, { x: 0, y: 0 }, true)
            rope.stop()
        }
    }

    /**
     * Where the carried plug's middle is at `time`, easing from where it started to its seated position.
     * @param {Layout} layout
     * @param {Carry} carried
     * @param {number} time
     * @returns {Point}
     */
    const computeCarryPoint = (layout, carried, time) => {
        const t = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (time - carried.start) / carried.duration))
        const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
        return lerp(carried.from, { x: layout.socket.x + layout.plugLength / 2, y: layout.socket.y }, eased)
    }

    /** @param {number} time */
    const tick = (time) => {
        const layout = measure()
        if (!layout) {
            frame = 0
            return
        }
        followLayout(layout)
        const isDrawnIn =
            grab &&
            !carry &&
            !props.connected &&
            grab.canSnap &&
            measureDistance(rope.readTip(), layout.socket) < MAGNET_RADIUS_PX * layout.scale
        if (isDrawnIn) startCarry(MAGNET_CARRY_MS)
        if (carry && grab) grab.target = computeCarryPoint(layout, carry, time)
        const from = grab ? grab.lastTarget : { x: 0, y: 0 }
        const to = grab ? grab.target : from
        if (reducedMotion.matches) {
            const steps = grab ? MAX_STEPS_PER_FRAME * 10 : SETTLE_STEPS
            for (let i = 0; i < steps && restingSteps < REST_STEPS; i += 1) advance(layout, to, true)
        } else {
            accumulator += Math.min((time - lastTime) / 1000, STEP_SECONDS * MAX_STEPS_PER_FRAME)
            lastTime = time
            const steps = Math.floor(accumulator / STEP_SECONDS)
            for (let i = 1; i <= steps; i += 1) advance(layout, lerp(from, to, i / steps), false)
            accumulator -= steps * STEP_SECONDS
        }
        if (grab) grab.lastTarget = grab.target
        draw(layout)
        frame = restingSteps < REST_STEPS || grab ? requestAnimationFrame(tick) : 0
    }

    const wake = () => {
        restingSteps = 0
        if (frame !== 0) return
        frame = requestAnimationFrame((time) => {
            lastTime = time
            accumulator = STEP_SECONDS
            tick(time)
        })
    }

    /** @param {PointerEvent} e */
    const handlePointerDown = (e) => {
        if (e.button !== 0 || !plugRef) return
        e.preventDefault()
        carry = null
        plugRef.setPointerCapture(e.pointerId)
        const tip = rope.readTip()
        const boot = rope.readBoot()
        const length = measureDistance(tip, boot) || 1
        const pointer = { x: e.clientX, y: e.clientY }
        const along = ((pointer.x - tip.x) * (boot.x - tip.x) + (pointer.y - tip.y) * (boot.y - tip.y)) / length
        const fraction = Math.min(1, Math.max(0, along / length))
        const held = lerp(tip, boot, fraction)
        grab = {
            pointerId: e.pointerId,
            target: pointer,
            lastTarget: pointer,
            client: pointer,
            gain: DRAG_GAIN,
            offset: { x: pointer.x - held.x, y: pointer.y - held.y },
            fraction,
            canSnap: true,
        }
        setIsHeld(true)
        wake()
    }

    /** @param {PointerEvent} e */
    const handlePointerMove = (e) => {
        if (!grab || e.pointerId !== grab.pointerId) return
        // The plug follows the pointer's movement scaled by the gain, kept within the window. Pulling a seated plug
        // out stays 1:1, so the pull-out resistance feels the same.
        const client = { x: e.clientX, y: e.clientY }
        const gain = props.connected ? 1 : grab.gain
        grab.target = {
            x: Math.min(window.innerWidth, Math.max(0, grab.target.x + (client.x - grab.client.x) * gain)),
            y: Math.min(window.innerHeight, Math.max(0, grab.target.y + (client.y - grab.client.y) * gain)),
        }
        grab.client = client
        wake()
    }

    /** @param {PointerEvent} e */
    const handlePointerUp = (e) => {
        if (!grab || e.pointerId !== grab.pointerId) return
        releaseGrab()
        wake()
    }

    /**
     * Enter or Space plugs the cable in, carrying the plug to the socket, or pulls it out.
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        if (e.repeat || grab) return
        if (props.connected) {
            props.onConnectedChange(false)
            playCableSound()
        } else {
            startCarry(CARRY_MS)
        }
        wake()
    }

    onMount(() => {
        const layout = measure()
        if (layout) {
            const hangingTip = {
                x: layout.anchor.x,
                y: layout.anchor.y + REST_LENGTH_PX * layout.scale + layout.plugLength,
            }
            rope.reset(props.connected ? layout.socket : hangingTip, layout.anchor)
            for (let i = 0; i < SETTLE_STEPS; i += 1) advance(layout, { x: 0, y: 0 }, true)
            draw(layout)
            lastLayout = layout
        }
        window.addEventListener('resize', wake)
    })

    createEffect(on(() => props.connected, wake, { defer: true }))

    onCleanup(() => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', wake)
    })

    return (
        <>
            {/*
             * The cable's layers are absolute rather than fixed: iOS Safari tints its toolbars from fixed elements, and
             * these have no background of their own. The cable draws outside its 1px box.
             */}
            <svg
                ref={svgRef}
                class="pointer-events-none absolute top-0 left-0 size-px overflow-visible"
                aria-hidden="true"
            >
                <defs>
                    <filter id="cable-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation={2 * plug().scale} />
                    </filter>
                </defs>
                <g fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path
                        d={path()}
                        stroke="rgb(0 0 0 / 0.35)"
                        stroke-width={THICKNESS_PX * plug().scale + 1}
                        filter="url(#cable-shadow)"
                        transform={`translate(0 ${3 * plug().scale})`}
                    />
                    <path d={path()} class="stroke-gray-400" stroke-width={THICKNESS_PX * plug().scale} />
                    <path d={path()} class="stroke-gray-300" stroke-width={(THICKNESS_PX - 1) * plug().scale} />
                    <path
                        d={path()}
                        stroke="rgb(255 255 255 / 0.45)"
                        stroke-width={0.75 * plug().scale}
                        transform={`translate(0 ${-0.75 * plug().scale})`}
                    />
                </g>
            </svg>
            {/*
             * RJ45 plug, positioned by its tip (left middle) and rotated around it. Its ::before pads the hit area to a
             * finger-sized target.
             */}
            <div
                ref={plugRef}
                class="peer absolute top-0 left-0 origin-top-left touch-none outline-none before:absolute before:-inset-3 before:content-['']"
                classList={{ 'cursor-grab': !isHeld(), 'cursor-grabbing': isHeld() }}
                style={{
                    transform: `translate(${plug().x}px, ${plug().y}px) rotate(${plug().angle}rad) scale(${plug().scale}) translateY(-50%)`,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label="Network cable"
                aria-pressed={props.connected}
            >
                <div ref={headRef} class="flex items-center shadow-xl">
                    <div class="relative flex items-center">
                        <div class="h-2.5 w-2 bg-gray-300">
                            <div class="flex size-full items-center">
                                <div class="flex h-10/12 w-1 flex-col justify-evenly border-y border-r-2 border-yellow-100">
                                    <span class="h-[1px] w-0.5 bg-yellow-100" />
                                    <span class="h-[1px] w-0.5 bg-yellow-100" />
                                    <span class="h-[1px] w-0.5 bg-yellow-100" />
                                </div>
                                <div class="flex h-10/12 w-0.5 flex-col justify-evenly border-y border-r-2 border-gray-400" />
                                <div class="flex h-10/12 w-[1px] flex-col justify-evenly border-y border-r border-yellow-100" />
                            </div>
                        </div>
                        <div class="size-3 rounded-r-xs bg-gray-300" />
                        <div class="absolute right-1 h-1 w-2.5 bg-white/40" />
                    </div>
                    <div class="h-2 w-0.5 rounded-r-xs bg-gray-400" />
                </div>
            </div>
            {/*
             * Focus ring for the plug, drawn unscaled around it with the icon links' padding, radius and outline, so it
             * matches the page's other focus rings.
             */}
            <div
                class="focus-ring-outline pointer-events-none absolute top-0 left-0 hidden origin-top-left peer-focus-visible:block"
                style={{
                    width: `${(headRef?.offsetWidth ?? 0) * plug().scale + FOCUS_PADDING_PX * 2}px`,
                    height: `${(headRef?.offsetHeight ?? 0) * plug().scale + FOCUS_PADDING_PX * 2}px`,
                    transform: `translate(${plug().x}px, ${plug().y}px) rotate(${plug().angle}rad) translate(-${FOCUS_PADDING_PX}px, -50%)`,
                }}
            />
        </>
    )
}

export default Cable
