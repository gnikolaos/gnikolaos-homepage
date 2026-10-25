import { describe, expect, test } from 'vitest'
import { readBrowserInfo } from './readBrowserInfo'

const globals = {
    navigator: {
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        language: 'en-GB',
        maxTouchPoints: 0,
    },
    window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 2, matchMedia: () => ({ matches: false }) },
    screen: { width: 1440, height: 900 },
}

describe('readBrowserInfo', () => {
    test('a Chrome userAgentData yields its branded name and platform', () => {
        const userAgentData = {
            platform: 'macOS',
            brands: [
                { brand: 'Not;A=Brand', version: '99' },
                { brand: 'Chromium', version: '141' },
                { brand: 'Google Chrome', version: '141' },
            ],
        }
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgentData } })
        expect(info.browser).toBe('Google Chrome 141')
        expect(info.os).toBe('macOS')
    })

    test('Edge brands yield Microsoft Edge', () => {
        const userAgentData = {
            platform: 'Windows',
            brands: [
                { brand: 'Microsoft Edge', version: '141' },
                { brand: 'Not;A=Brand', version: '99' },
                { brand: 'Chromium', version: '141' },
            ],
        }
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgentData } })
        expect(info.browser).toBe('Microsoft Edge 141')
    })

    test('brands with only Chromium and GREASE yield Chromium', () => {
        const userAgentData = {
            platform: 'Linux',
            brands: [
                { brand: 'Chromium', version: '141' },
                { brand: 'Not;A=Brand', version: '99' },
            ],
        }
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgentData } })
        expect(info.browser).toBe('Chromium 141')
    })

    test('brands with GREASE only fall back to the user agent string', () => {
        const userAgentData = { platform: 'Windows', brands: [{ brand: 'Not;A=Brand', version: '99' }] }
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgentData } })
        expect(info.browser).toBe('Chrome 141')
    })

    test('an empty platform falls back to the user agent string os', () => {
        const userAgentData = { platform: '', brands: [{ brand: 'Google Chrome', version: '141' }] }
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgentData } })
        expect(info.os).toBe('Windows')
    })

    test('a navigator without userAgentData parses the user agent string', () => {
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0'
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, userAgent } })
        expect(info.browser).toBe('Firefox 134')
        expect(info.os).toBe('Windows')
    })

    test('a tag with a region yields its English name', () => {
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, language: 'en-GB' } })
        expect(info.language).toBe('en-GB')
        expect(info.languageRegion).toBe('United Kingdom')
    })

    test('a tag without a region yields a null region', () => {
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, language: 'en' } })
        expect(info.language).toBe('en')
        expect(info.languageRegion).toBeNull()
    })

    test('the timezone is the one Intl resolves', () => {
        expect(readBrowserInfo(globals).timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone)
    })

    test('a fractional viewport is rounded', () => {
        const info = readBrowserInfo({ ...globals, window: { ...globals.window, innerWidth: 390.5, innerHeight: 844 } })
        expect(info.viewport).toEqual({ width: 391, height: 844 })
    })

    test('the pixel ratio is rounded to two decimals', () => {
        const info = readBrowserInfo({ ...globals, window: { ...globals.window, devicePixelRatio: 2.625 } })
        expect(info.screen).toEqual({ width: 1440, height: 900, pixelRatio: 2.63 })
    })

    test('matchMedia matching only the dark query yields a dark theme without reduced motion', () => {
        const matchingQueries = new Set(['(prefers-color-scheme: dark)'])
        const matchMedia = (/** @type {string} */ query) => ({ matches: matchingQueries.has(query) })
        const info = readBrowserInfo({ ...globals, window: { ...globals.window, matchMedia } })
        expect(info.darkTheme).toBe(true)
        expect(info.reducedMotion).toBe(false)
    })

    test.each([
        [5, true],
        [0, false],
    ])('maxTouchPoints %i yields touch %s', (maxTouchPoints, touch) => {
        const info = readBrowserInfo({ ...globals, navigator: { ...globals.navigator, maxTouchPoints } })
        expect(info.touch).toBe(touch)
    })
})
