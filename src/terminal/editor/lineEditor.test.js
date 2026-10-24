import { describe, expect, test } from 'vitest'
import { createEditorFromText } from './createEditorFromText'
import { createEmptyEditor } from './createEmptyEditor'
import { insert } from './insert'
import { lineEditor } from './lineEditor'

const createEditorAt = (input, cursor) => ({ input, cursor })

describe('createEmptyEditor', () => {
    test('returns blank input with cursor at 0', () => {
        expect(createEmptyEditor()).toEqual(createEditorAt('', 0))
    })
})

describe('createEditorFromText', () => {
    test('places cursor at the end', () => {
        expect(createEditorFromText('ls -la')).toEqual(createEditorAt('ls -la', 6))
    })
})

describe('insert', () => {
    test('inserts at the cursor and advances it', () => {
        expect(insert(createEditorAt('lsla', 2), ' -')).toEqual(createEditorAt('ls -la', 4))
    })

    test('clamps an out of range cursor before inserting', () => {
        expect(insert(createEditorAt('ab', 10), 'c')).toEqual(createEditorAt('abc', 3))
        expect(insert(createEditorAt('ab', -3), 'c')).toEqual(createEditorAt('cab', 1))
    })

    test('does not mutate the given state', () => {
        const frozenEditor = Object.freeze(createEditorAt('ab', 1))
        insert(frozenEditor, 'x')
        expect(frozenEditor).toEqual(createEditorAt('ab', 1))
    })
})

describe('backspace', () => {
    test('removes the char before the cursor', () => {
        expect(lineEditor.backspace(createEditorAt('abc', 2))).toEqual(createEditorAt('ac', 1))
    })

    test('does nothing at the start', () => {
        expect(lineEditor.backspace(createEditorAt('abc', 0))).toEqual(createEditorAt('abc', 0))
    })
})

describe('deleteForward', () => {
    test('removes the char under the cursor', () => {
        expect(lineEditor.deleteForward(createEditorAt('abc', 1))).toEqual(createEditorAt('ac', 1))
    })

    test('does nothing at the end', () => {
        expect(lineEditor.deleteForward(createEditorAt('abc', 3))).toEqual(createEditorAt('abc', 3))
    })
})

describe('moveLeft and moveRight', () => {
    test('move by one char', () => {
        expect(lineEditor.moveLeft(createEditorAt('abc', 2))).toEqual(createEditorAt('abc', 1))
        expect(lineEditor.moveRight(createEditorAt('abc', 1))).toEqual(createEditorAt('abc', 2))
    })

    test('clamp at both ends', () => {
        expect(lineEditor.moveLeft(createEditorAt('abc', 0))).toEqual(createEditorAt('abc', 0))
        expect(lineEditor.moveRight(createEditorAt('abc', 3))).toEqual(createEditorAt('abc', 3))
    })

    test('clamp a cursor that was already out of range', () => {
        expect(lineEditor.moveRight(createEditorAt('abc', 99))).toEqual(createEditorAt('abc', 3))
        expect(lineEditor.moveLeft(createEditorAt('abc', -5))).toEqual(createEditorAt('abc', 0))
    })
})

describe('moveHome and moveEnd', () => {
    test('jump to the line boundaries', () => {
        expect(lineEditor.moveHome(createEditorAt('abc', 2))).toEqual(createEditorAt('abc', 0))
        expect(lineEditor.moveEnd(createEditorAt('abc', 1))).toEqual(createEditorAt('abc', 3))
    })
})

describe('moveWordLeft', () => {
    test('jumps to the start of the current word', () => {
        expect(lineEditor.moveWordLeft(createEditorAt('cat file.md', 8))).toEqual(createEditorAt('cat file.md', 4))
    })

    test('skips multiple spaces to the start of the previous word', () => {
        expect(lineEditor.moveWordLeft(createEditorAt('cat    file', 7))).toEqual(createEditorAt('cat    file', 0))
    })

    test('stays at the start', () => {
        expect(lineEditor.moveWordLeft(createEditorAt('cat', 0))).toEqual(createEditorAt('cat', 0))
    })

    test('reaches 0 from leading whitespace', () => {
        expect(lineEditor.moveWordLeft(createEditorAt('   ls', 2))).toEqual(createEditorAt('   ls', 0))
    })
})

describe('moveWordRight', () => {
    test('jumps to the end of the current word', () => {
        expect(lineEditor.moveWordRight(createEditorAt('cat file.md', 1))).toEqual(createEditorAt('cat file.md', 3))
    })

    test('skips multiple spaces to the end of the next word', () => {
        expect(lineEditor.moveWordRight(createEditorAt('cat    file', 3))).toEqual(createEditorAt('cat    file', 11))
    })

    test('stays at the end', () => {
        expect(lineEditor.moveWordRight(createEditorAt('cat', 3))).toEqual(createEditorAt('cat', 3))
    })

    test('reaches the end from trailing whitespace', () => {
        expect(lineEditor.moveWordRight(createEditorAt('ls   ', 3))).toEqual(createEditorAt('ls   ', 5))
    })
})

describe('killWord', () => {
    test('deletes from the middle of a word back to its start', () => {
        expect(lineEditor.killWord(createEditorAt('cat file.md', 8))).toEqual(createEditorAt('cat .md', 4))
    })

    test('deletes trailing whitespace and the previous word', () => {
        expect(lineEditor.killWord(createEditorAt('cat file   ', 11))).toEqual(createEditorAt('cat ', 4))
    })

    test('keeps text after the cursor', () => {
        expect(lineEditor.killWord(createEditorAt('echo hello world', 10))).toEqual(createEditorAt('echo  world', 5))
    })

    test('does nothing at the start', () => {
        expect(lineEditor.killWord(createEditorAt('cat', 0))).toEqual(createEditorAt('cat', 0))
    })
})

describe('killToEnd', () => {
    test('removes everything after the cursor', () => {
        expect(lineEditor.killToEnd(createEditorAt('cat file', 3))).toEqual(createEditorAt('cat', 3))
    })
})

describe('clearLine', () => {
    test('empties the line', () => {
        expect(lineEditor.clearLine(createEditorAt('cat file', 3))).toEqual(createEditorAt('', 0))
    })
})
