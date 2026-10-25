import { formatMotd } from './formatMotd'

/** @import { BootOptions, IntroStep } from './types' */

const LINK_UP_DELAY_MS = 150
const DISCOVER_DELAY_MS = 300
const OFFER_DELAY_MS = 250
const REQUEST_DELAY_MS = 120
const ACK_DELAY_MS = 180
const BOUND_DELAY_MS = 150
const PROMPT_DELAY_MS = 500
const KEYSTROKE_DELAY_MS = 45
const MOTD_DELAY_MS = 700
const GATEWAY_IP = '10.0.0.1'

/**
 * Builds the intro steps: a DHCP boot, a typed ssh command and the motd, or the motd alone for reduced motion.
 * @param {BootOptions} options
 * @returns {IntroStep[]}
 */
const buildBootSteps = ({ reducedMotion, user, host, ip, lastLoginAt }) => {
    const motd = formatMotd({ host, ip, lastLoginAt })
    if (reducedMotion) return [{ text: motd, delayMs: 0 }]
    return [
        { text: 'eth0: link up, 1000Mbps, full duplex\n', delayMs: LINK_UP_DELAY_MS },
        { text: 'DHCPDISCOVER on eth0 to 255.255.255.255 port 67\n', delayMs: DISCOVER_DELAY_MS },
        { text: `DHCPOFFER of ${ip} from ${GATEWAY_IP}\n`, delayMs: OFFER_DELAY_MS },
        { text: `DHCPREQUEST for ${ip} on eth0 to 255.255.255.255 port 67\n`, delayMs: REQUEST_DELAY_MS },
        { text: `DHCPACK of ${ip} from ${GATEWAY_IP}\n`, delayMs: ACK_DELAY_MS },
        { text: `bound to ${ip} -- renewal in 43200 seconds.\n`, delayMs: BOUND_DELAY_MS },
        { text: '\n$ ', delayMs: PROMPT_DELAY_MS },
        ...[...`ssh ${user}@${host}`].map((char) => ({ text: char, delayMs: KEYSTROKE_DELAY_MS })),
        { text: '\n', delayMs: 0 },
        { text: motd, delayMs: MOTD_DELAY_MS },
    ]
}

export { buildBootSteps }
