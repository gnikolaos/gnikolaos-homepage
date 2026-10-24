/** @typedef {'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EIO'} FsErrorCode */
/** @typedef {{ name: string, type: 'dir' | 'file', size?: number, mtime?: string, title?: string }} Entry */
/** @typedef {{ loadManifest(dirUrl: string): Promise<Entry[]>, loadFile(fileUrl: string): Promise<string> }} FsIo */
/** @typedef {typeof globalThis.fetch} Fetch */
/** @typedef {ReturnType<typeof import('./createVfs').createVfs>} Vfs */

export {}
