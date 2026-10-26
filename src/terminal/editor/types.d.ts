export type EditorState = { readonly input: string; readonly cursor: number }
export type EditOp = keyof typeof import('./lineEditor').lineEditor
export type ScrollAction = { type: 'scroll'; by: 'line' | 'page' | 'edge'; direction: -1 | 1 }
export type Action =
    | { type: 'edit'; op: EditOp }
    | { type: 'submit' | 'historyPrev' | 'historyNext' | 'clearScreen' | 'interrupt' | 'eof' | 'complete' }
    | { type: 'historySearch' | 'acceptSearch' | 'cancel' }
    | { type: 'insert'; text: string }
    | { type: 'run'; line: string }
    | ScrollAction
export interface KeyLike {
    key: string
    ctrlKey?: boolean
    altKey?: boolean
    metaKey?: boolean
    shiftKey?: boolean
}
export type KeyTable = Record<string, Action>
