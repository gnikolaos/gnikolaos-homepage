/** @import { Span } from './types' */

/**
 * Tells whether a span has a color or any text attribute.
 * @param {Span} span
 * @returns {boolean}
 */
const isStyled = (span) => span.color !== null || span.bold || span.underline

export { isStyled }
