import clsx from 'clsx'
import { colorClasses } from './colorClasses'

/**
 * Resolves the Tailwind classes for an ANSI span's color, bold and underline styles.
 * @param {import('../shell/types').Span} span
 * @returns {string}
 */
const resolveSpanClass = (span) =>
    clsx(span.color && colorClasses[span.color], span.bold && 'font-bold', span.underline && 'underline')

export { resolveSpanClass }
