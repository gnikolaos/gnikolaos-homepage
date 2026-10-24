import { describe, expect, test } from 'vitest'
import { ParseError } from './ParseError'
import { parseLine } from './parseLine'

/** @param {string} line */
const argvs = (line) => parseLine(line).pipeline.map((stage) => stage.argv)

describe('parseLine', () => {
    test('returns an empty pipeline for blank input', () => {
        expect(parseLine('')).toEqual({ pipeline: [] })
        expect(parseLine('   \t ')).toEqual({ pipeline: [] })
    })

    test('splits on unquoted whitespace', () => {
        expect(argvs('  ls   -la\tposts ')).toEqual([['ls', '-la', 'posts']])
    })

    test('keeps single quoted text literal', () => {
        expect(argvs(`echo 'a  b \\" | c'`)).toEqual([['echo', 'a  b \\" | c']])
    })

    test('handles escapes inside double quotes', () => {
        expect(argvs('echo "say \\"hi\\" \\\\ ok"')).toEqual([['echo', 'say "hi" \\ ok']])
    })

    test('keeps other backslashes inside double quotes', () => {
        expect(argvs('echo "a\\nb"')).toEqual([['echo', 'a\\nb']])
    })

    test('escapes the next char outside quotes', () => {
        expect(argvs('cat my\\ post.md')).toEqual([['cat', 'my post.md']])
        expect(argvs('echo a\\|b')).toEqual([['echo', 'a|b']])
        expect(argvs('echo \\|')).toEqual([['echo', '|']])
    })

    test('keeps a trailing backslash literal', () => {
        expect(argvs('echo a\\')).toEqual([['echo', 'a\\']])
    })

    test('joins adjacent quoted and unquoted parts', () => {
        expect(argvs('echo a"b c"d')).toEqual([['echo', 'ab cd']])
        expect(argvs(`echo 'x'"y"z`)).toEqual([['echo', 'xyz']])
    })

    test('keeps empty quoted strings as arguments', () => {
        expect(argvs(`echo '' ""`)).toEqual([['echo', '', '']])
    })

    test('splits stages on unquoted pipes', () => {
        expect(argvs('ls|grep a | wc')).toEqual([['ls'], ['grep', 'a'], ['wc']])
    })

    test('does not split on quoted pipes', () => {
        expect(argvs(`echo "a|b" 'c|d'`)).toEqual([['echo', 'a|b', 'c|d']])
    })

    test('tokenizes a quoted file name piped into grep', () => {
        expect(argvs('cat "my post.md" | grep -i vite')).toEqual([
            ['cat', 'my post.md'],
            ['grep', '-i', 'vite'],
        ])
    })

    test.each(['ls |', '| ls', 'a || b', '|', 'a |  | b'])('throws on an empty stage in %j', (line) => {
        expect(() => parseLine(line)).toThrow(ParseError)
        expect(() => parseLine(line)).toThrow('parse error near `|`')
    })

    test.each([`echo 'abc`, 'echo "abc', 'echo "a\\"'])('throws on an unmatched quote in %j', (line) => {
        expect(() => parseLine(line)).toThrow(ParseError)
        expect(() => parseLine(line)).toThrow('unmatched quote')
    })
})
