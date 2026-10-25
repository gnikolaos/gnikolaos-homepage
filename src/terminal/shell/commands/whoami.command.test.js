import { describe, expect, test, vi } from 'vitest'
import whoami from './whoami.command'
import { BROWSER_INFO } from '@test/BROWSER_INFO'
import { runCommand } from '@test/runCommand'

describe('whoami', () => {
    test('prints the user, the nine rows and the note', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(whoami, [])
        expect(stdoutText()).toBe(
            [
                'guest',
                '',
                '  os        macOS',
                '  browser   Chrome 141',
                '  language  en-GB (United Kingdom)',
                '  timezone  Europe/Athens',
                '  viewport  1280x720',
                '  screen    1440x900 @2x',
                '  theme     dark',
                '  motion    no preference',
                '  touch     no',
                '',
                'Read by your browser, shown only to you, not stored.',
                '',
            ].join('\n'),
        )
        expect(stderrText()).toBe('')
        expect(exitCode).toBe(0)
    })

    test('prints unknown for an undetected os and browser', async () => {
        const { stdoutText } = await runCommand(whoami, [], {
            readBrowserInfo: () => ({ ...BROWSER_INFO, os: null, browser: null }),
        })
        expect(stdoutText()).toContain('  os        unknown\n')
        expect(stdoutText()).toContain('  browser   unknown\n')
    })

    test('prints the language tag alone when it has no region', async () => {
        const { stdoutText } = await runCommand(whoami, [], {
            readBrowserInfo: () => ({ ...BROWSER_INFO, language: 'en', languageRegion: null }),
        })
        expect(stdoutText()).toContain('  language  en\n')
    })

    test('prints a fractional pixel ratio', async () => {
        const { stdoutText } = await runCommand(whoami, [], {
            readBrowserInfo: () => ({ ...BROWSER_INFO, screen: { width: 1440, height: 900, pixelRatio: 2.63 } }),
        })
        expect(stdoutText()).toContain('  screen    1440x900 @2.63x\n')
    })

    test('prints light, reduced and yes for the opposite preferences', async () => {
        const { stdoutText } = await runCommand(whoami, [], {
            readBrowserInfo: () => ({ ...BROWSER_INFO, darkTheme: false, reducedMotion: true, touch: true }),
        })
        expect(stdoutText()).toContain('  theme     light\n')
        expect(stdoutText()).toContain('  motion    reduced\n')
        expect(stdoutText()).toContain('  touch     yes\n')
    })

    test('rejects an extra operand', async () => {
        const { stdoutText, stderrText, exitCode } = await runCommand(whoami, ['me'])
        expect(stderrText()).toBe("whoami: extra operand 'me'\n")
        expect(stdoutText()).toBe('')
        expect(exitCode).toBe(1)
    })

    test('ends with the note and a newline', async () => {
        const { stdoutText } = await runCommand(whoami, [])
        expect(stdoutText().endsWith('Read by your browser, shown only to you, not stored.\n')).toBe(true)
    })

    test('reads the browser info exactly once', async () => {
        const readBrowserInfo = vi.fn(() => BROWSER_INFO)
        await runCommand(whoami, [], { readBrowserInfo })
        expect(readBrowserInfo).toHaveBeenCalledTimes(1)
    })
})
