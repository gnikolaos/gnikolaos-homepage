import { describe, expect, test } from 'vitest'
import { createRegistry } from '../registry'
import { commands } from './index'

describe('commands', () => {
    test('exports all twelve commands with unique names', () => {
        const names = commands.map((command) => command.name).sort()
        expect(names).toEqual([
            'cat',
            'cd',
            'clear',
            'echo',
            'exit',
            'help',
            'history',
            'home',
            'logout',
            'ls',
            'open',
            'pwd',
        ])
        expect(() => createRegistry(commands)).not.toThrow()
    })
})
