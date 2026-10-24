import clsx from 'clsx'

/** @import { Color, Span } from '../shell/types' */

/** @type {Readonly<Record<Color, string>>} */
const colorClasses = Object.freeze({
    red: 'text-red-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    magenta: 'text-fuchsia-400',
    cyan: 'text-cyan-400',
    white: 'text-white',
})

/**
 * Resolves the Tailwind classes for an ANSI span's color, bold and underline styles.
 * @param {Span} span
 * @returns {string}
 */
const resolveSpanClass = (span) =>
    clsx(span.color && colorClasses[span.color], span.bold && 'font-bold', span.underline && 'underline')

export { resolveSpanClass }
