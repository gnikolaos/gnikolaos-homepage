/**
 * @typedef {object} FakeFile
 * @property {true} isFakeFile
 * @property {string} content
 * @property {number} [size]
 * @property {string} [mtime]
 * @property {boolean} [failRead]
 */

/**
 * Creates a fake file leaf for a fake tree.
 * @param {string} content
 * @param {{ size?: number, mtime?: string, failRead?: boolean }} [meta]
 * @returns {FakeFile}
 */
const createFakeFile = (content, meta = {}) => ({ isFakeFile: true, content, ...meta })

export { createFakeFile }
