import { ANSI_COLOR_CODES } from './ANSI_COLOR_CODES'
import { SGR_CODES } from './SGR_CODES'

/** @import { Style } from './types' */

const CSI = '\x1b['

/** @type {Readonly<Record<Style, number>>} */
const STYLE_CODES = Object.freeze({ bold: SGR_CODES.BOLD, underline: SGR_CODES.UNDERLINE, ...ANSI_COLOR_CODES })

/**
 * Wraps text in an SGR sequence for the given styles followed by a reset.
 * @param {string} text
 * @param {...Style} styles
 * @returns {string}
 */
const style = (text, ...styles) =>
    `${CSI}${styles.map((name) => STYLE_CODES[name]).join(';')}m${text}${CSI}${SGR_CODES.RESET}m`

export { style }
