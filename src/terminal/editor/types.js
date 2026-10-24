/** @typedef {{ readonly input: string, readonly cursor: number }} EditorState */
/** @typedef {keyof typeof import('./lineEditor').lineEditor} EditOp */
/**
 * @typedef {{ type: 'edit', op: EditOp }
 *     | { type: 'submit' | 'historyPrev' | 'historyNext' | 'clearScreen' | 'interrupt' | 'eof' | 'complete' }
 *     | { type: 'historySearch' | 'acceptSearch' | 'cancel' }} Action
 */
/**
 * @typedef {object} KeyLike
 * @property {string} key
 * @property {boolean} [ctrlKey]
 * @property {boolean} [altKey]
 * @property {boolean} [metaKey]
 * @property {boolean} [shiftKey]
 */
/** @typedef {Record<string, Action>} KeyTable */

export {}
