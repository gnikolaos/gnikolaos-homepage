export type UserAgentMatch = { browser: string | null; os: string | null }
export type UserAgentData = { platform: string; brands: { brand: string; version: string }[] }
export type NavigatorLike = {
    userAgent: string
    language: string
    maxTouchPoints: number
    userAgentData?: UserAgentData
}
export type WindowLike = {
    innerWidth: number
    innerHeight: number
    devicePixelRatio: number
    matchMedia: (query: string) => { matches: boolean }
}
export type ScreenLike = { width: number; height: number }
export interface BrowserInfo {
    os: string | null
    browser: string | null
    language: string
    languageRegion: string | null
    timezone: string
    viewport: { width: number; height: number }
    screen: { width: number; height: number; pixelRatio: number }
    darkTheme: boolean
    reducedMotion: boolean
    touch: boolean
}
