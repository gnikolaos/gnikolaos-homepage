import { describe, expect, test } from 'vitest'
import { doNothing } from '@test/doNothing'
import { createRegistry, defineCommand } from './registry.js'

/** @param {string} name */
const command = (name, hidden = false) =>
    defineCommand({ name, summary: `${name} summary`, usage: name, hidden, run: doNothing })

describe('defineCommand', () => {
    test('defaults hidden to false and freezes the command', () => {
        const cmd = defineCommand({ name: 'ls', summary: 'list', usage: 'ls', run: doNothing })
        expect(cmd).toEqual({
            name: 'ls',
            summary: 'list',
            usage: 'ls',
            hidden: false,
            complete: 'paths',
            run: doNothing,
        })
        expect(Object.isFrozen(cmd)).toBe(true)
    })

    test('keeps the completion kind when given', () => {
        const cmd = defineCommand({ name: 'cd', summary: 's', usage: 'u', complete: 'dirs', run: doNothing })
        expect(cmd.complete).toBe('dirs')
    })

    test('rejects an unknown completion kind', () => {
        const def = /** @type {any} */ ({ name: 'cd', summary: 's', usage: 'u', complete: 'files', run: doNothing })
        expect(() => defineCommand(def)).toThrow("unknown completion 'files'")
    })

    test('keeps hidden when given', () => {
        expect(command('secret', true).hidden).toBe(true)
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

describe('createRegistry', () => {
    const ls = command('ls')
    const cat = command('cat')
    const secret = command('secret', true)
    const registry = createRegistry([ls, secret, cat])

    test('gets commands by name', () => {
        expect(registry.get('ls')).toBe(ls)
        expect(registry.get('nope')).toBeUndefined()
    })

    test('reports whether a command exists', () => {
        expect(registry.has('secret')).toBe(true)
        expect(registry.has('nope')).toBe(false)
    })

    test('lists visible commands sorted by name', () => {
        expect(registry.list()).toEqual([cat, ls])
    })

    test('lists hidden commands when asked', () => {
        expect(registry.list({ includeHidden: true })).toEqual([cat, ls, secret])
    })

    test('rejects duplicate names', () => {
        expect(() => createRegistry([ls, command('ls')])).toThrow("duplicate command: 'ls'")
    })
})
