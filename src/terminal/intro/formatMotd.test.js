import { describe, expect, test } from 'vitest'
import { style } from '../shell/style'
import { stripAnsi } from '../shell/stripAnsi'
import { formatMotd } from './formatMotd'

const host = 'gnikolaos.gr'
const ip = '10.0.0.42'

describe('formatMotd', () => {
    test('prints the mark, host, help hint and last login line', () => {
        const motd = formatMotd({ host, ip, lastLoginAt: new Date(2026, 9, 24, 19, 51, 10) })
        expect(stripAnsi(motd)).toBe(
            '  __ _ _ _\n' +
                " / _` | ' \\\n" +
                ' \\__, |_||_|\n' +
                ' |___/\n' +
                'gnikolaos.gr\n' +
                '\n' +
                "Type 'help' to get started.\n" +
                '\n' +
                'Last login: Sat Oct 24 19:51:10 2026 from 10.0.0.42\n',
        )
    })

    test('pads a single-digit day with a space and zero-pads the time', () => {
        const motd = formatMotd({ host, ip, lastLoginAt: new Date(2026, 9, 4, 7, 5, 9) })
        expect(motd).toContain('Last login: Sun Oct  4 07:05:09 2026 from 10.0.0.42\n')
    })

    test('prints the host in bold under the mark', () => {
        const lines = formatMotd({ host, ip, lastLoginAt: null }).split('\n')
        const hostIndex = lines.indexOf(style(host, 'bold'))
        expect(hostIndex).toBeGreaterThan(0)
        expect(lines[hostIndex + 1]).toBe('')
    })

    test('a null last login omits the line and its preceding blank line', () => {
        const motd = formatMotd({ host, ip, lastLoginAt: null })
        expect(motd).not.toContain('Last login')
        const tail = `${style(host, 'bold')}\n\nType 'help' to get started.\n`
        expect(motd.slice(-tail.length)).toBe(tail)
    })

    test('the mark fits 8 lines of at most 40 columns without trailing spaces', () => {
        const lines = stripAnsi(formatMotd({ host, ip, lastLoginAt: null })).split('\n')
        const markLines = lines.slice(0, lines.indexOf(''))
        expect(markLines.length).toBeGreaterThan(0)
        expect(markLines.length).toBeLessThanOrEqual(8)
        for (const line of markLines) {
            expect(line.length).toBeLessThanOrEqual(40)
            expect(line).toBe(line.trimEnd())
        }
    })
})
