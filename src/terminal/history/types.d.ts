export type HistoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type Navigation = { index: number | null; draft: string }
export type NavigationStep = { nav: Navigation; input: string }
