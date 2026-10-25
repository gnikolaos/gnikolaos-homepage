import { parseUserAgent } from './parseUserAgent'

/** @import { BrowserInfo, NavigatorLike, ScreenLike, WindowLike } from './types' */

const GREASE_BRAND = /not.*brand/i

/**
 * Reads what the browser reports about itself: os, browser, locale, timezone, viewport, screen and media preferences.
 * @param {{ navigator?: NavigatorLike; window?: WindowLike; screen?: ScreenLike }} [globals]
 * @returns {BrowserInfo}
 */
const readBrowserInfo = ({
    navigator = globalThis.navigator,
    window = globalThis.window,
    screen = globalThis.screen,
} = {}) => {
    const { userAgentData } = navigator
    const userAgentMatch = parseUserAgent(navigator.userAgent)
    const realBrands = userAgentData?.brands.filter(({ brand }) => !GREASE_BRAND.test(brand)) ?? []
    const preferredBrand = realBrands.find(({ brand }) => brand !== 'Chromium') ?? realBrands[0]
    const { region } = new Intl.Locale(navigator.language)
    return {
        os: userAgentData?.platform || userAgentMatch.os,
        browser: preferredBrand ? `${preferredBrand.brand} ${preferredBrand.version}` : userAgentMatch.browser,
        language: navigator.language,
        languageRegion: (region && new Intl.DisplayNames(['en'], { type: 'region' }).of(region)) ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: { width: Math.round(window.innerWidth), height: Math.round(window.innerHeight) },
        screen: {
            width: screen.width,
            height: screen.height,
            pixelRatio: Math.round(window.devicePixelRatio * 100) / 100,
        },
        darkTheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        touch: navigator.maxTouchPoints > 0,
    }
}

export { readBrowserInfo }
