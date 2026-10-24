import { describe, expect, test } from 'vitest'
import { buildBootSteps } from './buildBootSteps'
import { formatMotd } from './formatMotd'

const options = {
    reducedMotion: false,
    user: 'visitor',
    host: 'gnikolaos.gr',
    ip: '10.0.0.42',
    lastLoginAt: new Date(2026, 9, 24, 19, 51, 10),
}
const motd = formatMotd(options)

/**
 * @param {{ text: string }[]} steps
 * @returns {string}
 */
const joinText = (steps) => steps.map((step) => step.text).join('')

describe('buildBootSteps', () => {
    test('the full sequence joins into the boot transcript', () => {
        expect(joinText(buildBootSteps(options))).toBe(
            'eth0: link up, 1000Mbps, full duplex\n' +
                'DHCPDISCOVER on eth0 to 255.255.255.255 port 67\n' +
                'DHCPOFFER of 10.0.0.42 from 10.0.0.1\n' +
                'DHCPREQUEST for 10.0.0.42 on eth0 to 255.255.255.255 port 67\n' +
                'DHCPACK of 10.0.0.42 from 10.0.0.1\n' +
                'bound to 10.0.0.42 -- renewal in 43200 seconds.\n' +
                '\n$ ssh visitor@gnikolaos.gr\n' +
                motd,
        )
    })

    test('the ssh command is typed one character per step at 45 ms', () => {
        const steps = buildBootSteps(options)
        const start = steps.findIndex((step) => step.text === '\n$ ') + 1
        const command = 'ssh visitor@gnikolaos.gr'
        const typed = steps.slice(start, start + command.length)
        expect(typed).toEqual([...command].map((char) => ({ text: char, delayMs: 45 })))
        expect(steps[start + command.length]).toEqual({ text: '\n', delayMs: 0 })
    })

    test('the motd follows last after 700 ms', () => {
        expect(buildBootSteps(options).at(-1)).toEqual({ text: motd, delayMs: 700 })
    })

    test('every delay is a non-negative integer', () => {
        for (const { delayMs } of buildBootSteps(options)) {
            expect(Number.isInteger(delayMs)).toBe(true)
            expect(delayMs).toBeGreaterThanOrEqual(0)
        }
    })

    test('the delays total under 5000 ms', () => {
        const totalMs = buildBootSteps(options).reduce((sum, step) => sum + step.delayMs, 0)
        expect(totalMs).toBeLessThan(5000)
    })

    test('reduced motion yields the motd only', () => {
        expect(buildBootSteps({ ...options, reducedMotion: true })).toEqual([{ text: motd, delayMs: 0 }])
    })

    test('a null last login leaves no last login line', () => {
        expect(joinText(buildBootSteps({ ...options, lastLoginAt: null }))).not.toContain('Last login')
    })
})
