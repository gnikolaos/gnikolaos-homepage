/** @import { FakeFile } from './types' */

/**
 * Creates a fake file leaf for a fake tree.
 * @param {string} content
 * @param {{ size?: number, mtime?: string, failRead?: boolean }} [meta]
 * @returns {FakeFile}
 */
const createFakeFile = (content, meta = {}) => ({ isFakeFile: true, content, ...meta })

export { createFakeFile }
