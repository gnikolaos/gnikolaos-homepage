export type Connection = ReturnType<typeof import('./createConnection').createConnection>
export type ConnectionRecord = { connected: boolean; booted: boolean }
