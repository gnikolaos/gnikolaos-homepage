import { style } from '../shell/style'

const MARK = ['  __ _ _ _', " / _` | ' \\", ' \\__, |_||_|', ' |___/']

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * @param {number} value
 * @returns {string}
 */
const padTwo = (value) => String(value).padStart(2, '0')

/**
 * Formats a date like ctime(3) in local time: `Www Mmm dd HH:MM:SS yyyy`.
 * @param {Date} date
 * @returns {string}
 */
const formatCtime = (date) => {
    const day = String(date.getDate()).padStart(2, ' ')
    const time = [date.getHours(), date.getMinutes(), date.getSeconds()].map(padTwo).join(':')
    return `${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${day} ${time} ${date.getFullYear()}`
}

/**
 * Formats the message of the day shown once the ssh session is up: mark, host, help hint and last login.
 * @param {{ host: string, ip: string, lastLoginAt: Date | null }} options
 * @returns {string}
 */
const formatMotd = ({ host, ip, lastLoginAt }) => {
    const lines = [...MARK, style(host, 'bold'), '', `Type 'help' to get started.`]
    if (lastLoginAt) lines.push('', `Last login: ${formatCtime(lastLoginAt)} from ${ip}`)
    return lines.map((line) => `${line}\n`).join('')
}

export { formatMotd }
