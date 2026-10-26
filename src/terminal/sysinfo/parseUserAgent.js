/** @import { UserAgentMatch } from './types' */

const BROWSER_PATTERNS = [
    { name: 'Edge', pattern: /\bEdg(?:e|A|iOS)?\/(\d+)/ },
    { name: 'Firefox', pattern: /\b(?:Firefox|FxiOS)\/(\d+)/ },
    { name: 'Chrome', pattern: /\b(?:Chrome|CriOS)\/(\d+)/ },
    { name: 'Safari', pattern: /\bVersion\/(\d+)[\d.]* .*\bSafari\// },
]

const OS_PATTERNS = [
    { name: 'iOS', pattern: /\b(?:iPhone|iPad|iPod)\b/ },
    { name: 'Android', pattern: /\bAndroid\b/ },
    { name: 'Windows', pattern: /\bWindows\b/ },
    { name: 'macOS', pattern: /\bMacintosh\b/ },
    { name: 'ChromeOS', pattern: /\bCrOS\b/ },
    { name: 'Linux', pattern: /\bLinux\b|\bX11\b/ },
]

/**
 * Parses a user agent string into the browser with its major version and the operating system.
 * @param {string} userAgent
 * @returns {UserAgentMatch}
 */
const parseUserAgent = (userAgent) => {
    const os = OS_PATTERNS.find(({ pattern }) => pattern.test(userAgent))?.name ?? null
    for (const { name, pattern } of BROWSER_PATTERNS) {
        const match = pattern.exec(userAgent)
        if (match) return { browser: `${name} ${match[1]}`, os }
    }
    return { browser: null, os }
}

export { parseUserAgent }
