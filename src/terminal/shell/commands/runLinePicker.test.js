import { describe, expect, test } from 'vitest'
import { createFakeCtx } from '@test/createFakeCtx'
import { runLinePicker } from './runLinePicker'

const tree = { 'a.txt': 'one\ntwo\n' }

/**
 * @param {string[]} argv
 * @param {string} [name]
 */
const runRecordingCount = async (argv, name = 'head') => {
    const fake = createFakeCtx({ tree })
    /** @type {number[]} */
    const counts = []
    const pick = (/** @type {string[]} */ lines, /** @type {number} */ count) => {
        counts.push(count)
        return lines
    }
    const exitCode = await runLinePicker(fake.ctx, argv, null, { name, usage: `${name} [-n N] [file...]`, pick })
    return { ...fake, counts, exitCode }
}

describe('runLinePicker', () => {
    test('defaults to 10', async () => {
        const { counts, stdoutText } = await runRecordingCount(['a.txt'])
        expect(counts).toEqual([10])
        expect(stdoutText()).toBe('one\ntwo\n')
    })

    test.each([[['-n', '5']], [['-n5']], [['-5']]])('reads %j', async (argv) => {
        const { counts, stdoutText } = await runRecordingCount([...argv, 'a.txt'])
        expect(counts).toEqual([5])
        expect(stdoutText()).toBe('one\ntwo\n')
    })

    test('keeps other flags and everything after --', async () => {
        expect((await runRecordingCount(['-x', 'a.txt'])).stderrText()).toBe("head: invalid option -- 'x'\n")
        const { counts, stderrText, exitCode } = await runRecordingCount(['--', '-3', 'a.txt'])
        expect(stderrText()).toBe('head: -3: No such file or directory\n')
        expect(counts).toEqual([10])
        expect(exitCode).toBe(1)
    })

    test('rejects a non-numeric value', async () => {
        const { stderrText, exitCode } = await runRecordingCount(['-n', 'abc'], 'tail')
        expect(stderrText()).toBe("tail: invalid number of lines: 'abc'\n")
        expect(exitCode).toBe(2)
        expect((await runRecordingCount(['-n-2'], 'tail')).stderrText()).toBe("tail: invalid number of lines: '-2'\n")
    })

    test('rejects a missing value', async () => {
        const { stderrText, exitCode } = await runRecordingCount(['-n'])
        expect(stderrText()).toBe("head: option requires an argument -- 'n'\n")
        expect(exitCode).toBe(2)
    })
})
