const ESC = '\x1b'

const SGR_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g')

export { SGR_PATTERN }
