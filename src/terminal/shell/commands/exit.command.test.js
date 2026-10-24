import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import exit from './exit.command'
import { createFakeCtx } from '@test/createFakeCtx'

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('exit', () => {
    test('prints the goodbye line, then closes the session after a pause', async () => {
        const { ctx, recorded, stdoutText } = createFakeCtx()
        const done = exit.run(ctx, [], null)
        expect(exit.name).toBe('exit')
        expect(stdoutText()).toBe('Connection to gnikolaos.gr closed.\n')
        await vi.advanceTimersByTimeAsync(599)
        expect(recorded.sessionCloses).toBe(0)
        await vi.advanceTimersByTimeAsync(1)
        await done
        expect(recorded.sessionCloses).toBe(1)
        expect(recorded.navigations).toEqual([])
    })

    test('an abort during the pause keeps the session open', async () => {
        const controller = new AbortController()
        const { ctx, recorded } = createFakeCtx({ signal: controller.signal })
        const done = exit.run(ctx, [], null)
        controller.abort(new Error('interrupted'))
        await expect(done).rejects.toThrow('interrupted')
        await vi.advanceTimersByTimeAsync(600)
        expect(recorded.sessionCloses).toBe(0)
    })
})
