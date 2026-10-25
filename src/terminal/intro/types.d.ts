export type IntroStep = { text: string; delayMs: number }
export type MotdOptions = { host: string; ip: string; lastLoginAt: Date | null }
export type BootOptions = MotdOptions & { reducedMotion: boolean; user: string }
