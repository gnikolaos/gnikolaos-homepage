import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sleep } from './sleep'

describe('sleep', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test('resolves after the given milliseconds when the signal never aborts', async () => {
        const onResolve = vi.fn()
        sleep(600, new AbortController().signal).then(onResolve)
        await vi.advanceTimersByTimeAsync(599)
        expect(onResolve).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1)
        expect(onResolve).toHaveBeenCalledOnce()
    })

    test('rejects with the reason when the signal aborts first', async () => {
        const controller = new AbortController()
        const reason = new Error('interrupted')
        const pending = sleep(600, controller.signal)
        await vi.advanceTimersByTimeAsync(100)
        controller.abort(reason)
        await expect(pending).rejects.toBe(reason)
    })

    test('clears the timer on abort', async () => {
        const controller = new AbortController()
        const pending = sleep(600, controller.signal).catch(() => 'aborted')
        controller.abort()
        expect(vi.getTimerCount()).toBe(0)
        await vi.advanceTimersByTimeAsync(600)
        expect(await pending).toBe('aborted')
    })

    test('rejects at once for an already aborted signal', async () => {
        const reason = new Error('already')
        await expect(sleep(600, AbortSignal.abort(reason))).rejects.toBe(reason)
        expect(vi.getTimerCount()).toBe(0)
    })
})
