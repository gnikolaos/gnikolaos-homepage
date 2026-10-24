import { describe, expect, test } from 'vitest'
import {
    backspace,
    clearLine,
    deleteForward,
    empty,
    fromText,
    insert,
    killToEnd,
    killWord,
    moveEnd,
    moveHome,
    moveLeft,
    moveRight,
    moveWordLeft,
    moveWordRight,
} from './lineEditor.js'

const at = (input, cursor) => ({ input, cursor })

describe('empty', () => {
    test('returns blank input with cursor at 0', () => {
        expect(empty()).toEqual(at('', 0))
    })
})

describe('fromText', () => {
    test('places cursor at the end', () => {
        expect(fromText('ls -la')).toEqual(at('ls -la', 6))
    })
})

describe('insert', () => {
    test('inserts at the cursor and advances it', () => {
        expect(insert(at('lsla', 2), ' -')).toEqual(at('ls -la', 4))
    })

    test('clamps an out of range cursor before inserting', () => {
        expect(insert(at('ab', 10), 'c')).toEqual(at('abc', 3))
        expect(insert(at('ab', -3), 'c')).toEqual(at('cab', 1))
    })

    test('does not mutate the given state', () => {
        const s = Object.freeze(at('ab', 1))
        insert(s, 'x')
        expect(s).toEqual(at('ab', 1))
    })
})

describe('backspace', () => {
    test('removes the char before the cursor', () => {
        expect(backspace(at('abc', 2))).toEqual(at('ac', 1))
    })

    test('does nothing at the start', () => {
        expect(backspace(at('abc', 0))).toEqual(at('abc', 0))
    })
})

describe('deleteForward', () => {
    test('removes the char under the cursor', () => {
        expect(deleteForward(at('abc', 1))).toEqual(at('ac', 1))
    })

    test('does nothing at the end', () => {
        expect(deleteForward(at('abc', 3))).toEqual(at('abc', 3))
    })
})

describe('moveLeft and moveRight', () => {
    test('move by one char', () => {
        expect(moveLeft(at('abc', 2))).toEqual(at('abc', 1))
        expect(moveRight(at('abc', 1))).toEqual(at('abc', 2))
    })

    test('clamp at both ends', () => {
        expect(moveLeft(at('abc', 0))).toEqual(at('abc', 0))
        expect(moveRight(at('abc', 3))).toEqual(at('abc', 3))
    })

    test('clamp a cursor that was already out of range', () => {
        expect(moveRight(at('abc', 99))).toEqual(at('abc', 3))
        expect(moveLeft(at('abc', -5))).toEqual(at('abc', 0))
    })
})

describe('moveHome and moveEnd', () => {
    test('jump to the line boundaries', () => {
        expect(moveHome(at('abc', 2))).toEqual(at('abc', 0))
        expect(moveEnd(at('abc', 1))).toEqual(at('abc', 3))
    })
})

describe('moveWordLeft', () => {
    test('jumps to the start of the current word', () => {
        expect(moveWordLeft(at('cat file.md', 8))).toEqual(at('cat file.md', 4))
    })

    test('skips multiple spaces to the start of the previous word', () => {
        expect(moveWordLeft(at('cat    file', 7))).toEqual(at('cat    file', 0))
    })

    test('stays at the start', () => {
        expect(moveWordLeft(at('cat', 0))).toEqual(at('cat', 0))
    })

    test('reaches 0 from leading whitespace', () => {
        expect(moveWordLeft(at('   ls', 2))).toEqual(at('   ls', 0))
    })
})

describe('moveWordRight', () => {
    test('jumps to the end of the current word', () => {
        expect(moveWordRight(at('cat file.md', 1))).toEqual(at('cat file.md', 3))
    })

    test('skips multiple spaces to the end of the next word', () => {
        expect(moveWordRight(at('cat    file', 3))).toEqual(at('cat    file', 11))
    })

    test('stays at the end', () => {
        expect(moveWordRight(at('cat', 3))).toEqual(at('cat', 3))
    })

    test('reaches the end from trailing whitespace', () => {
        expect(moveWordRight(at('ls   ', 3))).toEqual(at('ls   ', 5))
    })
})

describe('killWord', () => {
    test('deletes from the middle of a word back to its start', () => {
        expect(killWord(at('cat file.md', 8))).toEqual(at('cat .md', 4))
    })

    test('deletes trailing whitespace and the previous word', () => {
        expect(killWord(at('cat file   ', 11))).toEqual(at('cat ', 4))
    })

    test('keeps text after the cursor', () => {
        expect(killWord(at('echo hello world', 10))).toEqual(at('echo  world', 5))
    })

    test('does nothing at the start', () => {
        expect(killWord(at('cat', 0))).toEqual(at('cat', 0))
    })
})

describe('killToEnd', () => {
    test('removes everything after the cursor', () => {
        expect(killToEnd(at('cat file', 3))).toEqual(at('cat', 3))
    })
})

describe('clearLine', () => {
    test('empties the line', () => {
        expect(clearLine(at('cat file', 3))).toEqual(at('', 0))
    })
})
