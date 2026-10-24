import { EXIT_CODES } from './EXIT_CODES'
import { ParseError } from './ParseError'
import { createBufferSink } from './createBufferSink'
import { extractErrorMessage } from './extractErrorMessage'
import { lookupCommands } from './lookupCommands'
import { parseLine } from './parseLine'

/** @typedef {import('./types').Command} Command */
/** @typedef {import('./types').Ctx} Ctx */
/** @typedef {import('./types').Shell} Shell */
/** @typedef {import('./types').ShellDeps} ShellDeps */
/** @typedef {import('./types').Sink} Sink */
/** @typedef {import('./types').Stage} Stage */

/**
 * Creates a shell that parses a line, looks up its commands and runs them as a pipeline.
 * @param {ShellDeps} deps
 * @returns {Shell}
 */
const createShell = (deps) => {
    const { registry, fs, session, getCwd, setCwd, getHistory, navigate, openUrl } = deps

    /**
     * @param {Sink} sink
     * @param {AbortSignal} signal
     * @returns {Ctx}
     */
    const createCtx = (sink, signal) => ({
        fs,
        cwd: getCwd(),
        setCwd,
        home: fs.home,
        session,
        history: getHistory(),
        registry,
        navigate,
        openUrl,
        signal,
        stdout: sink.stdout,
        stderr: sink.stderr,
        markdown: sink.markdown,
        clear: sink.clear,
    })

    /**
     * @param {Command} command
     * @param {string[]} args
     * @param {string | null} stdin
     * @param {Sink} sink
     * @param {AbortSignal} signal
     * @returns {Promise<number>}
     */
    const runStage = async (command, args, stdin, sink, signal) => {
        try {
            const exitCode = await command.run(createCtx(sink, signal), args, stdin)
            return exitCode ?? 0
        } catch (error) {
            if (signal.aborted) return EXIT_CODES.ABORTED
            sink.stderr(`zsh: ${command.name}: ${extractErrorMessage(error)}\n`)
            return EXIT_CODES.THREW
        }
    }

    /**
     * @param {Command[]} commands
     * @param {Stage[]} pipeline
     * @param {Sink} sink
     * @param {AbortSignal} signal
     * @returns {Promise<number>}
     */
    const runPipeline = async (commands, pipeline, sink, signal) => {
        /** @type {string | null} */
        let stdin = null
        let exitCode = 0
        for (const [index, command] of commands.entries()) {
            if (signal.aborted) return EXIT_CODES.ABORTED
            const isLast = index === commands.length - 1
            const buffer = isLast ? null : createBufferSink(sink)
            exitCode = await runStage(command, pipeline[index].argv.slice(1), stdin, buffer?.sink ?? sink, signal)
            if (signal.aborted) return EXIT_CODES.ABORTED
            stdin = buffer?.read() ?? null
        }
        return exitCode
    }

    /**
     * @param {string} line
     * @param {Sink} sink
     * @param {AbortSignal} [signal]
     * @returns {Promise<{ exitCode: number }>}
     */
    const run = async (line, sink, signal = new AbortController().signal) => {
        let pipeline
        try {
            pipeline = parseLine(line).pipeline
        } catch (error) {
            if (!(error instanceof ParseError)) throw error
            sink.stderr(`zsh: ${error.message}\n`)
            return { exitCode: EXIT_CODES.PARSE_ERROR }
        }
        if (pipeline.length === 0) return { exitCode: 0 }

        const lookup = lookupCommands(registry, pipeline)
        if ('missing' in lookup) {
            sink.stderr(`zsh: command not found: ${lookup.missing}\n`)
            return { exitCode: EXIT_CODES.NOT_FOUND }
        }
        return { exitCode: await runPipeline(lookup.commands, pipeline, sink, signal) }
    }

    return { run }
}

export { createShell }
