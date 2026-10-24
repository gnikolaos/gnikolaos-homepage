export type FsErrorCode = 'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EIO'
export type Entry = { name: string; type: 'dir' | 'file'; size?: number; mtime?: string; title?: string }
export type FsIo = { loadManifest(dirUrl: string): Promise<Entry[]>; loadFile(fileUrl: string): Promise<string> }
export type Fetch = typeof globalThis.fetch
export type Vfs = ReturnType<typeof import('./createVfs').createVfs>
