/** @typedef {{ label: string | null, text: string }} TextInput */
/** @typedef {{ inputs: TextInput[], failed: boolean }} ReadInputsResult */
/** @typedef {{ count: number, rest: string[], error: string | null }} LineCount */
/** @typedef {(lines: string[], count: number) => string[]} PickLines */
/** @typedef {{ name: string, usage: string, pick: PickLines }} LinePicker */

/** @typedef {{ name: string, type: 'dir' | 'file', size?: number, mtime?: string, title?: string }} ListingEntry */
/** @typedef {{ all: boolean, long: boolean }} LsOptions */
/** @typedef {{ isDir: boolean, entries: ListingEntry[] }} Listing */
/** @typedef {{ mode: string, links: string, size: string, date: string, name: string }} LongRow */

/** @typedef {(a: string, b: string) => number} CompareLines */

/** @typedef {{ line: string, count: number }} LineRun */

/** @typedef {'l' | 'w' | 'c'} CountKey */
/** @typedef {Record<CountKey, number>} Counts */
/** @typedef {{ counts: Counts, label: string | null }} CountRow */

export {}
