import { fetchFile } from './fetchFile'
import { fetchManifest } from './fetchManifest'

/** @type {import('./types').FsIo} */
const browserIo = {
    loadManifest: (dirUrl) => fetchManifest(dirUrl),
    loadFile: (fileUrl) => fetchFile(fileUrl),
}

export { browserIo }
