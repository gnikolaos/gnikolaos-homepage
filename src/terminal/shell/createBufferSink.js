import { stripAnsi } from './stripAnsi'

/** @import { Sink } from './types' */

/**
 * Creates a sink that buffers stdout and markdown without ANSI styles and forwards stderr to `sink`.
 * @param {Sink} sink
 * @returns {{ sink: Sink, read: () => string }}
 */
const createBufferSink = (sink) => {
    let buffer = ''
    const append = (/** @type {string} */ text) => {
        buffer += stripAnsi(text)
    }
    return {
        sink: { stdout: append, markdown: append, stderr: sink.stderr, clear: () => {} },
        read: () => buffer,
    }
}

export { createBufferSink }
