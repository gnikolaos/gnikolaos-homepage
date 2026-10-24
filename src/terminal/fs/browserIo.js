import { fetchFile } from './fetchFile'
import { fetchManifest } from './fetchManifest'

/** @import { FsIo } from './types' */

/** @type {FsIo} */
const browserIo = {
    loadManifest: (dirUrl) => fetchManifest(dirUrl),
    loadFile: (fileUrl) => fetchFile(fileUrl),
}

export { browserIo }
