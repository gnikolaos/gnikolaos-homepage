/** @typedef {{ argv: string[] }} Stage */
/** @typedef {{ pipeline: Stage[] }} ParsedLine */

/** @typedef {'wordPart' | 'wordBreak' | 'stageBreak' | 'unclosedQuote'} TokenKind */
/**
 * @typedef {object} Token
 * @property {TokenKind} kind
 * @property {number} start   index of the token's first raw char
 * @property {number} end     index after the token's last raw char
 * @property {string} text    unescaped text the token adds to its word
 */
/** @typedef {(line: string, start: number) => Token[]} WordReader */

/**
 * @typedef {object} Sink
 * @property {(text: string) => void} stdout
 * @property {(text: string) => void} stderr
 * @property {(content: string) => void} markdown
 * @property {() => void} clear
 */

/**
 * @typedef {object} ShellHooks
 * @property {() => string} getCwd
 * @property {(absPath: string) => void} setCwd
 * @property {() => readonly string[]} getHistory
 * @property {(path: string) => void} navigate
 * @property {(url: string) => void} openUrl
 */

/** @typedef {{ user: string, host: string }} Session */
/** @typedef {ShellHooks & { registry: Registry, fs: import('../fs/types').Vfs, session: Session }} ShellDeps */

/**
 * @typedef {object} Shell
 * @property {(line: string, sink: Sink, signal?: AbortSignal) => Promise<{ exitCode: number }>} run
 */

/**
 * @typedef {object} Ctx
 * @property {import('../fs/types').Vfs} fs
 * @property {string} cwd
 * @property {(absPath: string) => void} setCwd
 * @property {string} home
 * @property {Session} session
 * @property {readonly string[]} history
 * @property {Registry} registry
 * @property {(path: string) => void} navigate
 * @property {(url: string) => void} openUrl
 * @property {AbortSignal} signal
 * @property {(text: string) => void} stdout
 * @property {(text: string) => void} stderr
 * @property {(content: string) => void} markdown
 * @property {() => void} clear
 */

/** @typedef {'paths' | 'dirs' | 'commands' | 'none'} CompletionKind */

/**
 * @typedef {object} Command
 * @property {string} name
 * @property {string} summary
 * @property {string} usage
 * @property {boolean} hidden
 * @property {CompletionKind} complete   what Tab offers for the command's arguments
 * @property {(ctx: Ctx, argv: string[], stdin: string | null) => number | void | Promise<number | void>} run
 */

/**
 * @typedef {object} CommandDefinition
 * @property {string} name
 * @property {string} summary
 * @property {string} usage
 * @property {boolean} [hidden]
 * @property {CompletionKind} [complete]
 * @property {Command['run']} run
 */

/**
 * @typedef {object} Registry
 * @property {(name: string) => Command | undefined} get
 * @property {(name: string) => boolean} has
 * @property {(options?: { includeHidden?: boolean }) => Command[]} list
 */

/** @typedef {{ start: number, end: number, candidates: string[] }} Completion */

/**
 * @typedef {object} WordAtCursor
 * @property {number} start
 * @property {number} end
 * @property {string} word        unescaped text between start and the cursor
 * @property {string | null} command   first word of the current stage, null when the word itself is the first
 */

/** @typedef {'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'} Color */
/** @typedef {Color | 'bold' | 'underline'} Style */
/** @typedef {{ color: Color | null, bold: boolean, underline: boolean }} StyleState */
/** @typedef {StyleState & { text: string }} Span */

/** @typedef {{ flags: Set<string>, positionals: string[] }} SplitFlags */

export {}
