import { describe, expect, test } from 'vitest'
import { createRegistry } from '../createRegistry'
import { commands } from './index'

describe('commands', () => {
    test('exports all twenty commands with unique names', () => {
        const names = commands.map((command) => command.name).sort()
        expect(names).toEqual([
            'cat',
            'cd',
            'clear',
            'echo',
            'exit',
            'grep',
            'head',
            'help',
            'history',
            'home',
            'logout',
            'ls',
            'man',
            'open',
            'pwd',
            'sort',
            'tail',
            'uniq',
            'wc',
            'whoami',
        ])
        expect(() => createRegistry(commands)).not.toThrow()
    })

    test('keeps only the basic commands visible to plain help', () => {
        const visible = createRegistry(commands)
            .list()
            .map((command) => command.name)
        expect(visible).toEqual(['cat', 'cd', 'clear', 'exit', 'help', 'ls', 'man', 'open'])
    })
})
