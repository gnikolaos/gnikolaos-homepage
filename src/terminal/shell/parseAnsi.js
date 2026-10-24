import { ANSI_COLOR_CODES } from './ANSI_COLOR_CODES'
import { SGR_CODES } from './SGR_CODES'
import { SGR_PATTERN } from './SGR_PATTERN'

/** @import { Color, Span, StyleState } from './types' */

const BRIGHT_COLOR_OFFSET = 60

/** @type {Color[]} */
const COLOR_NAMES = /** @type {Color[]} */ (Object.keys(ANSI_COLOR_CODES))

/** @returns {StyleState} */
const createPlainStyleState = () => ({ color: null, bold: false, underline: false })

/** @type {Readonly<Record<number, (state: StyleState) => StyleState>>} */
const sgrCodeHandlers = Object.freeze({
    [SGR_CODES.RESET]: createPlainStyleState,
    [SGR_CODES.BOLD]: (state) => ({ ...state, bold: true }),
    [SGR_CODES.UNDERLINE]: (state) => ({ ...state, underline: true }),
    [SGR_CODES.NORMAL_INTENSITY]: (state) => ({ ...state, bold: false }),
    [SGR_CODES.NO_UNDERLINE]: (state) => ({ ...state, underline: false }),
    [SGR_CODES.DEFAULT_COLOR]: (state) => ({ ...state, color: null }),
})

/**
 * @param {number} code
 * @returns {Color | undefined}
 */
const findColorByCode = (code) =>
    COLOR_NAMES.find((color) => [ANSI_COLOR_CODES[color], ANSI_COLOR_CODES[color] + BRIGHT_COLOR_OFFSET].includes(code))

/**
 * @param {StyleState} state
 * @param {number} code
 * @returns {StyleState}
 */
const applySgrCodeToStyle = (state, code) => {
    const handler = sgrCodeHandlers[code]
    if (handler) return handler(state)
    const color = findColorByCode(code)
    return color ? { ...state, color } : state
}

/**
 * @param {StyleState} state
 * @param {string} params
 * @returns {StyleState}
 */
const applySgrParamsToStyle = (state, params) =>
    params.split(';').reduce((current, param) => applySgrCodeToStyle(current, Number(param || '0')), state)

/**
 * Parses text with SGR sequences into spans of plain text, each carrying the style in effect for it.
 * @param {string} text
 * @returns {Span[]}
 */
const parseAnsi = (text) => {
    /** @type {Span[]} */
    const spans = []
    let state = createPlainStyleState()
    let spanStart = 0
    for (const match of text.matchAll(SGR_PATTERN)) {
        if (match.index > spanStart) spans.push({ ...state, text: text.slice(spanStart, match.index) })
        state = applySgrParamsToStyle(state, match[1])
        spanStart = match.index + match[0].length
    }
    if (spanStart < text.length) spans.push({ ...state, text: text.slice(spanStart) })
    return spans
}

export { parseAnsi }
