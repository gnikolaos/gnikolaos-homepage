import { browserIo } from './browserIo'
import { createVfs } from './createVfs'

/**
 * The app's virtual filesystem, backed by the published content manifest.
 */
const vfs = createVfs(browserIo)

export { vfs }
