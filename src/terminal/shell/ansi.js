/** @typedef {'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'} Color */
/** @typedef {Color | 'bold' | 'underline'} Style */
/** @typedef {{ color: Color | null, bold: boolean, underline: boolean }} StyleState */
/** @typedef {StyleState & { text: string }} Span */

const ESC = '\x1b'
const CSI = `${ESC}[`
const SGR_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g')

/** @type {Color[]} */
const COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
const FIRST_COLOR_CODE = 31
const FIRST_BRIGHT_COLOR_CODE = 91

/** @type {Record<Style, number>} */
const codes = {
    bold: 1,
    underline: 4,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
}

/** @returns {StyleState} */
const plain = () => ({ color: null, bold: false, underline: false })

/**
 * @param {string} text
 * @param {...Style} styles
 * @returns {string}
 */
const style = (text, ...styles) => `${CSI}${styles.map((name) => codes[name]).join(';')}m${text}${CSI}0m`

/**
 * @param {string} text
 * @returns {string}
 */
const stripAnsi = (text) => text.replace(SGR_PATTERN, '')

/**
 * @param {number} code
 * @returns {Color | undefined}
 */
const colorOf = (code) => COLORS[code - FIRST_COLOR_CODE] ?? COLORS[code - FIRST_BRIGHT_COLOR_CODE]

/**
 * @param {StyleState} state
 * @param {number} code
 * @returns {StyleState}
 */
const applyCode = (state, code) => {
    switch (code) {
        case 0:
            return plain()
        case 1:
            return { ...state, bold: true }
        case 4:
            return { ...state, underline: true }
        case 22:
            return { ...state, bold: false }
        case 24:
            return { ...state, underline: false }
        case 39:
            return { ...state, color: null }
        default: {
            const color = colorOf(code)
            return color ? { ...state, color } : state
        }
    }
}

/**
 * @param {StyleState} state
 * @param {string} params
 * @returns {StyleState}
 */
const applySequence = (state, params) =>
    params.split(';').reduce((current, param) => applyCode(current, Number(param || '0')), state)

/**
 * @param {string} text
 * @returns {Span[]}
 */
const parseAnsi = (text) => {
    /** @type {Span[]} */
    const spans = []
    let state = plain()
    let last = 0
    for (const match of text.matchAll(SGR_PATTERN)) {
        if (match.index > last) spans.push({ ...state, text: text.slice(last, match.index) })
        state = applySequence(state, match[1])
        last = match.index + match[0].length
    }
    if (last < text.length) spans.push({ ...state, text: text.slice(last) })
    return spans
}

/**
 * @param {Span} span
 * @returns {boolean}
 */
const isStyled = (span) => span.color !== null || span.bold || span.underline

export { style, stripAnsi, parseAnsi, isStyled }
