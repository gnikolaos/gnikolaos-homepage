import type { Vfs } from '../fs/types'

export type Stage = { argv: string[] }
export type ParsedLine = { pipeline: Stage[] }

export type TokenKind = 'wordPart' | 'wordBreak' | 'stageBreak' | 'unclosedQuote'
export interface Token {
    kind: TokenKind
    /** index of the token's first raw char */
    start: number
    /** index after the token's last raw char */
    end: number
    /** unescaped text the token adds to its word */
    text: string
}
export type WordReader = (line: string, start: number) => Token[]

export interface Sink {
    stdout: (text: string) => void
    stderr: (text: string) => void
    markdown: (content: string) => void
    clear: () => void
}

export interface ShellHooks {
    getCwd: () => string
    setCwd: (absPath: string) => void
    getHistory: () => readonly string[]
    navigate: (path: string) => void
    closeSession: () => void
    openUrl: (url: string) => void
}

export type Session = { user: string; host: string }
export type ShellDeps = ShellHooks & { registry: Registry; fs: Vfs; session: Session }

export interface Shell {
    run: (line: string, sink: Sink, signal?: AbortSignal) => Promise<{ exitCode: number }>
}

export interface Ctx {
    fs: Vfs
    cwd: string
    setCwd: (absPath: string) => void
    home: string
    session: Session
    history: readonly string[]
    registry: Registry
    navigate: (path: string) => void
    closeSession: () => void
    openUrl: (url: string) => void
    signal: AbortSignal
    stdout: (text: string) => void
    stderr: (text: string) => void
    markdown: (content: string) => void
    clear: () => void
}

export type CompletionKind = 'paths' | 'dirs' | 'commands' | 'none'

export interface Command {
    name: string
    summary: string
    usage: string
    hidden: boolean
    /** what Tab offers for the command's arguments */
    complete: CompletionKind
    run: (ctx: Ctx, argv: string[], stdin: string | null) => number | void | Promise<number | void>
}

export interface CommandDefinition {
    name: string
    summary: string
    usage: string
    hidden?: boolean
    complete?: CompletionKind
    run: Command['run']
}

export interface Registry {
    get: (name: string) => Command | undefined
    has: (name: string) => boolean
    list: (options?: { includeHidden?: boolean }) => Command[]
}

export type Completion = { start: number; end: number; candidates: string[] }

export interface WordAtCursor {
    start: number
    end: number
    /** unescaped text between start and the cursor */
    word: string
    /** first word of the current stage, null when the word itself is the first */
    command: string | null
}

export type Color = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
export type Style = Color | 'bold' | 'underline'
export type StyleState = { color: Color | null; bold: boolean; underline: boolean }
export type Span = StyleState & { text: string }

export type SplitFlags = { flags: Set<string>; positionals: string[] }
