/**
 * Waits `ms` milliseconds, rejecting with the signal's reason when it aborts first.
 * @param {number} ms
 * @param {AbortSignal} signal
 * @returns {Promise<void>}
 */
const sleep = (ms, signal) => {
    if (signal.aborted) return Promise.reject(signal.reason)
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timer)
            reject(signal.reason)
        }
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, ms)
        signal.addEventListener('abort', onAbort, { once: true })
    })
}

export { sleep }
