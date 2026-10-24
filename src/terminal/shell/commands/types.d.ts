export type TextInput = { label: string | null; text: string }
export type ReadInputsResult = { inputs: TextInput[]; failed: boolean }
export type LineCount = { count: number; rest: string[]; error: string | null }
export type PickLines = (lines: string[], count: number) => string[]
export type LinePicker = { name: string; usage: string; pick: PickLines }

export type ListingEntry = { name: string; type: 'dir' | 'file'; size?: number; mtime?: string; title?: string }
export type LsOptions = { all: boolean; long: boolean }
export type Listing = { isDir: boolean; entries: ListingEntry[] }
export type LongRow = { mode: string; links: string; size: string; date: string; name: string }

export type CompareLines = (a: string, b: string) => number

export type LineRun = { line: string; count: number }

export type CountKey = 'l' | 'w' | 'c'
export type Counts = Record<CountKey, number>
export type CountRow = { counts: Counts; label: string | null }
