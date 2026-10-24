export type FakeFile = { isFakeFile: true; content: string; size?: number; mtime?: string; failRead?: boolean }
export type FakeTree = { [name: string]: FakeTree | FakeFile | string }
