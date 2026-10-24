/**
 * @param {string[]} names
 * @param {number} rows
 * @returns {string[][]}
 */
const splitIntoColumns = (names, rows) => {
    /** @type {string[][]} */
    const columns = []
    for (let i = 0; i < names.length; i += rows) columns.push(names.slice(i, i + rows))
    return columns
}

/**
 * @param {string[][]} columns
 * @returns {number[]}
 */
const measureColumnWidths = (columns) => columns.map((column) => Math.max(...column.map((name) => name.length)))

/**
 * @param {number[]} widths
 * @returns {number}
 */
const measureLineWidth = (widths) => widths.reduce((sum, width) => sum + width, 0) + 2 * (widths.length - 1)

/**
 * @param {string[]} names
 * @param {number} width
 * @returns {string[][]}
 */
const fitColumns = (names, width) => {
    for (let rows = 1; rows < names.length; rows += 1) {
        const columns = splitIntoColumns(names, rows)
        if (measureLineWidth(measureColumnWidths(columns)) <= width) return columns
    }
    return splitIntoColumns(names, names.length)
}

/**
 * Formats names into columns filled top to bottom, using as few rows as fit within `width` chars.
 * @param {string[]} names
 * @param {number} width
 * @returns {string}
 */
const formatColumns = (names, width) => {
    if (names.length === 0) return ''
    const columns = fitColumns(names, Math.max(1, width))
    const widths = measureColumnWidths(columns)
    const lines = columns[0].map((_, row) => {
        const cells = columns.map((column) => column[row]).filter((cell) => cell !== undefined)
        return cells
            .map((cell, columnIndex) => (columnIndex === cells.length - 1 ? cell : cell.padEnd(widths[columnIndex])))
            .join('  ')
    })
    return lines.map((line) => line + '\n').join('')
}

export { formatColumns }
