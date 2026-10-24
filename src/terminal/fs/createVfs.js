import { CONTENT_URL } from './CONTENT_URL'
import { FsError } from './FsError'
import { isFsError } from './isFsError'

/** @typedef {import('./types').Entry} Entry */
/** @typedef {import('./types').FsIo} FsIo */

/**
 * @param {string} absPath
 * @returns {string[]}
 */
const splitPath = (absPath) => absPath.split('/').filter(Boolean)

/**
 * @param {string[]} segments
 * @returns {string}
 */
const joinSegments = (segments) => '/' + segments.join('/')

/**
 * @param {string} path
 * @returns {string}
 */
const normalizePath = (path) => {
    /** @type {string[]} */
    const keptSegments = []
    for (const segment of splitPath(path)) {
        if (segment === '.') continue
        if (segment === '..') keptSegments.pop()
        else keptSegments.push(segment)
    }
    return joinSegments(keptSegments)
}

/**
 * @param {string} absPath
 * @returns {string}
 */
const extractBasename = (absPath) => splitPath(absPath).at(-1) ?? '/'

/**
 * @param {string} name
 * @returns {Entry}
 */
const createDirEntry = (name) => ({ name, type: 'dir' })

/**
 * @param {string} path
 * @param {unknown} error
 * @returns {FsError}
 */
const ensureFsError = (path, error) => (isFsError(error) ? error : new FsError('EIO', path))

/**
 * @template T
 * @param {Map<string, Promise<T>>} cache
 * @param {string} key
 * @param {() => Promise<T>} load
 * @returns {Promise<T>}
 */
const loadWithCache = (cache, key, load) => {
    const cachedLoad = cache.get(key)
    if (cachedLoad) return cachedLoad
    const pendingLoad = load().catch((error) => {
        cache.delete(key)
        throw ensureFsError(key, error)
    })
    cache.set(key, pendingLoad)
    return pendingLoad
}

/**
 * Creates a read-only virtual filesystem that serves the content tree under `home`.
 * @param {FsIo} io
 * @param {{ home?: string }} [options]
 */
const createVfs = (io, { home = '/home/visitor' } = {}) => {
    const homeSegments = splitPath(home)
    /** @type {Map<string, Promise<Entry[]>>} */
    const manifestCache = new Map()
    /** @type {Map<string, Promise<string>>} */
    const fileCache = new Map()

    /**
     * @param {string} absPath
     * @returns {boolean}
     */
    const isUnderHome = (absPath) => absPath === home || absPath.startsWith(home + '/')

    /**
     * @param {string} absPath
     * @returns {string | null}
     */
    const findSyntheticChild = (absPath) => {
        const segments = splitPath(absPath)
        const isAncestorOfHome = segments.every((segment, i) => homeSegments[i] === segment)
        return isAncestorOfHome && segments.length < homeSegments.length ? homeSegments[segments.length] : null
    }

    /**
     * Resolves a path against cwd, expanding `~` and normalizing `.` and `..`.
     * @param {string} cwd
     * @param {string} path
     * @returns {string}
     */
    const resolve = (cwd, path) => {
        if (path === '') return cwd
        if (path === '~' || path.startsWith('~/')) return normalizePath(home + path.slice(1))
        if (path.startsWith('/')) return normalizePath(path)
        return normalizePath(cwd + '/' + path)
    }

    /**
     * Formats an absolute path for display, abbreviating home to `~`.
     * @param {string} absPath
     * @returns {string}
     */
    const formatDisplayPath = (absPath) => (isUnderHome(absPath) ? '~' + absPath.slice(home.length) : absPath)

    /**
     * Finds the content url for a path under home, or null outside it.
     * @param {string} absPath
     * @returns {string | null}
     */
    const findContentUrl = (absPath) => (isUnderHome(absPath) ? CONTENT_URL + absPath.slice(home.length) : null)

    /**
     * @param {string} absPath
     * @returns {Promise<Entry[]>}
     */
    const loadManifest = (absPath) =>
        loadWithCache(manifestCache, absPath, () => io.loadManifest(/** @type {string} */ (findContentUrl(absPath))))

    /**
     * @param {string} absPath
     * @returns {Promise<Entry>}
     */
    const lookupUnderHome = async (absPath) => {
        let currentPath = home
        /** @type {Entry} */
        let currentEntry = createDirEntry(extractBasename(home))
        for (const segment of splitPath(absPath.slice(home.length))) {
            if (currentEntry.type !== 'dir') throw new FsError('ENOTDIR', absPath)
            const entries = await loadManifest(currentPath)
            const matchingEntry = entries.find((candidate) => candidate.name === segment)
            if (!matchingEntry) throw new FsError('ENOENT', absPath)
            currentEntry = matchingEntry
            currentPath = currentPath + '/' + segment
        }
        return currentEntry
    }

    /**
     * Looks up the entry at an absolute path.
     * @param {string} absPath
     * @returns {Promise<Entry>}
     */
    const stat = async (absPath) => {
        const path = normalizePath(absPath)
        if (findSyntheticChild(path) !== null) return createDirEntry(extractBasename(path))
        if (!isUnderHome(path)) throw new FsError('ENOENT', path)
        return lookupUnderHome(path)
    }

    /**
     * Lists the entries of the dir at an absolute path.
     * @param {string} absPath
     * @returns {Promise<Entry[]>}
     */
    const readdir = async (absPath) => {
        const path = normalizePath(absPath)
        const syntheticChild = findSyntheticChild(path)
        if (syntheticChild !== null) return [createDirEntry(syntheticChild)]
        const entry = await stat(path)
        if (entry.type !== 'dir') throw new FsError('ENOTDIR', path)
        return loadManifest(path)
    }

    /**
     * Reads the content of the file at an absolute path.
     * @param {string} absPath
     * @returns {Promise<string>}
     */
    const readFile = async (absPath) => {
        const path = normalizePath(absPath)
        const entry = await stat(path)
        if (entry.type === 'dir') throw new FsError('EISDIR', path)
        return loadWithCache(fileCache, path, () => io.loadFile(/** @type {string} */ (findContentUrl(path))))
    }

    return { home, resolve, formatDisplayPath, findContentUrl, stat, readdir, readFile }
}

export { createVfs }
