/**
 * Completes nothing, for use when no completer is configured.
 * @type {import('./types').Completer}
 */
const completeNothing = async (_input, cursor) => ({ start: cursor, end: cursor, candidates: [] })

export { completeNothing }
