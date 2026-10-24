import { describe, expect, test } from 'vitest'
import { defineFakeCommand } from '@test/defineFakeCommand'
import { createRegistry } from './createRegistry'

describe('createRegistry', () => {
    const ls = defineFakeCommand('ls')
    const cat = defineFakeCommand('cat')
    const secret = defineFakeCommand('secret', { hidden: true })
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
        expect(() => createRegistry([ls, defineFakeCommand('ls')])).toThrow("duplicate command: 'ls'")
    })
})
