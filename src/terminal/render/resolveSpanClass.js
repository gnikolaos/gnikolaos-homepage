import clsx from 'clsx'
import { colorClasses } from './colorClasses'

/** @import { Span } from '../shell/types' */

/**
 * Resolves the Tailwind classes for an ANSI span's color, bold and underline styles.
 * @param {Span} span
 * @returns {string}
 */
const resolveSpanClass = (span) =>
    clsx(span.color && colorClasses[span.color], span.bold && 'font-bold', span.underline && 'underline')

export { resolveSpanClass }
