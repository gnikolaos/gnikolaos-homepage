export type Point = { x: number; y: number }

/**
 * `seat`: the plug sits level with its tip at `tip`.
 * `grab`: the point `fraction` of the way from tip to boot is held at `point`; the plug turns freely around it,
 * pulled towards level by `align` (0 to 1).
 */
export type RopeHold = { kind: 'seat'; tip: Point } | { kind: 'grab'; point: Point; fraction: number; align: number }

export type RopeStep = {
    anchor: Point
    /** Direction the cable leaves the anchor in; its length sets how far that direction carries. Zero for none. */
    anchorLead: Point
    cableLength: number
    plugLength: number
    gravity: number
    /** Velocity kept per step (air drag). */
    damping: number
    /** How strongly each point's velocity is pulled towards its neighbours' per step (0 to 1). */
    internalDamping: number
    iterations: number
    /** Bending stiffness (0 to 1); keeps the cable from folding sharply. */
    bend: number
    hold: RopeHold | null
}
