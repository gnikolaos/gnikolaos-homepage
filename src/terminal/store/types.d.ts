import type { KeyValueStorage } from '@gnikolaos/lib/shared/types'
import type { EditOp, EditorState } from '../editor/types'
import type { Navigation } from '../history/types'
import type { Shell, ShellHooks } from '../shell/types'

export type Completer = ReturnType<typeof import('../shell/createCompleter').createCompleter>

export type PromptStatus = 'ok' | 'error'
export type PromptBlock = {
    id: number
    kind: 'prompt'
    cwd: string
    input: string
    status: PromptStatus
    running: boolean
}
export type OutputContent = { kind: 'plain' | 'markdown'; content: string }
export type OutputBlock = { id: number; kind: 'output'; output: OutputContent }
export type Block = PromptBlock | OutputBlock
export type SearchState = { query: string; index: number | null; draft: string }

export interface TerminalState {
    session: { user: string; host: string; cwd: string }
    blocks: Block[]
    editor: EditorState
    history: { entries: string[]; nav: Navigation }
    busy: boolean
    lastExitCode: number
    search: SearchState | null
    columns: number
}

export interface TerminalActions {
    typeText: (text: string) => void
    applyEdit: (op: EditOp) => void
    submit: () => Promise<void>
    historyPrev: () => void
    historyNext: () => void
    interrupt: () => void
    eof: () => Promise<void>
    clearScreen: () => void
    runLine: (line: string) => Promise<void>
    setNavigate: (fn: (path: string) => void) => void
    complete: () => Promise<void>
    historySearch: () => void
    acceptSearch: () => void
    cancel: () => void
    setColumns: (columns: number) => void
}

export type TerminalStore = { state: TerminalState; actions: TerminalActions }

export interface TerminalOptions {
    makeShell: (hooks: ShellHooks) => Shell
    storage: KeyValueStorage
    home: string
    user?: string
    host?: string
    openUrl?: (url: string) => void
    complete?: Completer
}
