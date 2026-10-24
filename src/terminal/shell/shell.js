import { parse, ParseError } from './parser.js'
import { stripAnsi } from './ansi.js'

/** @typedef {import('./registry.js').Ctx} Ctx */
/** @typedef {import('./registry.js').Command} Command */
/** @typedef {import('./registry.js').Registry} Registry */

/**
 * @typedef {object} Sink
 * @property {(text: string) => void} stdout
 * @property {(text: string) => void} stderr
 * @property {(content: string) => void} markdown
 * @property {() => void} clear
 */

/**
 * @typedef {object} ShellDeps
 * @property {Registry} registry
 * @property {import('../fs/vfs').Vfs} fs
 * @property {{ user: string, host: string }} session
 * @property {() => string} getCwd
 * @property {(absPath: string) => void} setCwd
 * @property {() => readonly string[]} getHistory
 * @property {(path: string) => void} navigate
 * @property {(url: string) => void} openUrl
 */

/**
 * @typedef {object} Shell
 * @property {(line: string, sink: Sink, signal?: AbortSignal) => Promise<{ exitCode: number }>} run
 */

const EXIT_PARSE_ERROR = 2
const EXIT_NOT_FOUND = 127
const EXIT_THREW = 1
const EXIT_ABORTED = 130

/**
 * @param {unknown} error
 * @returns {string}
 */
const messageOf = (error) => (error instanceof Error ? error.message : String(error))

/**
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

/**
 * @param {Registry} registry
 * @param {{ argv: string[] }[]} pipeline
 * @returns {{ commands: Command[] } | { missing: string }}
 */
const lookupCommands = (registry, pipeline) => {
    const commands = []
    for (const { argv } of pipeline) {
        const command = registry.get(argv[0])
        if (!command) return { missing: argv[0] }
        commands.push(command)
    }
    return { commands }
}

/**
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
            if (signal.aborted) return EXIT_ABORTED
            sink.stderr(`zsh: ${command.name}: ${messageOf(error)}\n`)
            return EXIT_THREW
        }
    }

    /**
     * @param {Command[]} commands
     * @param {{ argv: string[] }[]} pipeline
     * @param {Sink} sink
     * @param {AbortSignal} signal
     * @returns {Promise<number>}
     */
    const runPipeline = async (commands, pipeline, sink, signal) => {
        /** @type {string | null} */
        let stdin = null
        let exitCode = 0
        for (const [index, command] of commands.entries()) {
            if (signal.aborted) return EXIT_ABORTED
            const isLast = index === commands.length - 1
            const buffer = isLast ? null : createBufferSink(sink)
            exitCode = await runStage(command, pipeline[index].argv.slice(1), stdin, buffer?.sink ?? sink, signal)
            if (signal.aborted) return EXIT_ABORTED
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
            pipeline = parse(line).pipeline
        } catch (error) {
            if (!(error instanceof ParseError)) throw error
            sink.stderr(`zsh: ${error.message}\n`)
            return { exitCode: EXIT_PARSE_ERROR }
        }
        if (pipeline.length === 0) return { exitCode: 0 }

        const lookup = lookupCommands(registry, pipeline)
        if ('missing' in lookup) {
            sink.stderr(`zsh: command not found: ${lookup.missing}\n`)
            return { exitCode: EXIT_NOT_FOUND }
        }
        return { exitCode: await runPipeline(lookup.commands, pipeline, sink, signal) }
    }

    return { run }
}

export { createShell }
