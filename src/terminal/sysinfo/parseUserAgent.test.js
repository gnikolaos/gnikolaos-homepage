import { describe, expect, test } from 'vitest'
import { parseUserAgent } from './parseUserAgent'

describe('parseUserAgent', () => {
    test.each([
        [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Chrome 141',
            'macOS',
        ],
        [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Chrome 141',
            'Windows',
        ],
        [
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Chrome 141',
            'Linux',
        ],
        [
            'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
            'Chrome 141',
            'Android',
        ],
        [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
            'Chrome 141',
            'iOS',
        ],
        [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0',
            'Firefox 134',
            'macOS',
        ],
        ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0', 'Firefox 134', 'Windows'],
        ['Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0', 'Firefox 134', 'Linux'],
        ['Mozilla/5.0 (Android 15; Mobile; rv:134.0) Gecko/134.0 Firefox/134.0', 'Firefox 134', 'Android'],
        [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/134.0 Mobile/15E148 Safari/605.1.15',
            'Firefox 134',
            'iOS',
        ],
        [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
            'Safari 18',
            'macOS',
        ],
        [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
            'Safari 18',
            'iOS',
        ],
        [
            'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
            'Safari 18',
            'iOS',
        ],
        [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
            'Edge 141',
            'Windows',
        ],
        [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
            'Edge 141',
            'macOS',
        ],
        [
            'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0',
            'Edge 141',
            'Android',
        ],
        [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/141.0.0.0 Mobile/15E148 Safari/605.1.15',
            'Edge 141',
            'iOS',
        ],
        [
            'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Chrome 141',
            'ChromeOS',
        ],
        ['curl/8.7.1', null, null],
        ['', null, null],
    ])('parses %j as %s on %s', (userAgent, browser, os) => {
        expect(parseUserAgent(userAgent)).toEqual({ browser, os })
    })
})
