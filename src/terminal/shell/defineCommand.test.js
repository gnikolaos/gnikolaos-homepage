import { describe, expect, test } from 'vitest'
import { doNothing } from '@test/doNothing'
import { defineFakeCommand } from '@test/defineFakeCommand'
import { defineCommand } from './defineCommand'

describe('defineCommand', () => {
    test('defaults hidden to false and freezes the command', () => {
        const command = defineCommand({ name: 'ls', summary: 'list', usage: 'ls', run: doNothing })
        expect(command).toEqual({
            name: 'ls',
            summary: 'list',
            usage: 'ls',
            hidden: false,
            complete: 'paths',
            run: doNothing,
        })
        expect(Object.isFrozen(command)).toBe(true)
    })

    test('keeps the completion kind when given', () => {
        const command = defineCommand({ name: 'cd', summary: 's', usage: 'u', complete: 'dirs', run: doNothing })
        expect(command.complete).toBe('dirs')
    })

    test('rejects an unknown completion kind', () => {
        const def = /** @type {any} */ ({ name: 'cd', summary: 's', usage: 'u', complete: 'files', run: doNothing })
        expect(() => defineCommand(def)).toThrow("unknown completion 'files'")
    })

    test('keeps hidden when given', () => {
        expect(defineFakeCommand('secret', { hidden: true }).hidden).toBe(true)
    })

    test.each(['', 'two words', 'tab\tname'])('rejects invalid name %j', (name) => {
        expect(() => defineCommand({ name, summary: 's', usage: 'u', run: doNothing })).toThrow(TypeError)
    })

    test('rejects a missing run function', () => {
        const def = /** @type {any} */ ({ name: 'ls', summary: 's', usage: 'u' })
        expect(() => defineCommand(def)).toThrow('has no run function')
    })

    test('rejects missing summary or usage', () => {
        const noSummary = /** @type {any} */ ({ name: 'ls', usage: 'u', run: doNothing })
        const noUsage = /** @type {any} */ ({ name: 'ls', summary: 's', run: doNothing })
        expect(() => defineCommand(noSummary)).toThrow(TypeError)
        expect(() => defineCommand(noUsage)).toThrow(TypeError)
    })
})
