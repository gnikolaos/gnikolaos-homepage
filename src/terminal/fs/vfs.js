import { FsError, isFsError } from './FsError'

/** @typedef {{ name: string, type: 'dir' | 'file', size?: number, mtime?: string, title?: string }} Entry */
/** @typedef {{ loadManifest(dirUrl: string): Promise<Entry[]>, loadFile(fileUrl: string): Promise<string> }} FsIo */
/** @typedef {ReturnType<typeof createVfs>} Vfs */

const CONTENT_URL = '/dirs'

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
const normalize = (path) => {
    /** @type {string[]} */
    const stack = []
    for (const segment of splitPath(path)) {
        if (segment === '.') continue
        if (segment === '..') stack.pop()
        else stack.push(segment)
    }
    return joinSegments(stack)
}

/**
 * @param {string} absPath
 * @returns {string}
 */
const basename = (absPath) => splitPath(absPath).at(-1) ?? '/'

/**
 * @param {string} name
 * @returns {Entry}
 */
const dirEntry = (name) => ({ name, type: 'dir' })

/**
 * @param {string} path
 * @param {unknown} error
 * @returns {FsError}
 */
const toFsError = (path, error) => (isFsError(error) ? error : new FsError('EIO', path))

/**
 * @template T
 * @param {Map<string, Promise<T>>} cache
 * @param {string} key
 * @param {() => Promise<T>} load
 * @returns {Promise<T>}
 */
const cachedLoad = (cache, key, load) => {
    const cached = cache.get(key)
    if (cached) return cached
    const pending = load().catch((error) => {
        cache.delete(key)
        throw toFsError(key, error)
    })
    cache.set(key, pending)
    return pending
}

/**
 * @param {FsIo} io
 * @param {{ home?: string }} [options]
 */
const createVfs = (io, { home = '/home/visitor' } = {}) => {
    const homeSegments = splitPath(home)
    /** @type {Map<string, Promise<Entry[]>>} */
    const manifests = new Map()
    /** @type {Map<string, Promise<string>>} */
    const files = new Map()

    /**
     * @param {string} absPath
     * @returns {boolean}
     */
    const isUnderHome = (absPath) => absPath === home || absPath.startsWith(home + '/')

    /**
     * @param {string} absPath
     * @returns {string | null}
     */
    const syntheticChild = (absPath) => {
        const segments = splitPath(absPath)
        const isAncestorOfHome = segments.every((segment, i) => homeSegments[i] === segment)
        return isAncestorOfHome && segments.length < homeSegments.length ? homeSegments[segments.length] : null
    }

    /**
     * @param {string} cwd
     * @param {string} path
     * @returns {string}
     */
    const resolve = (cwd, path) => {
        if (path === '') return cwd
        if (path === '~' || path.startsWith('~/')) return normalize(home + path.slice(1))
        if (path.startsWith('/')) return normalize(path)
        return normalize(cwd + '/' + path)
    }

    /**
     * @param {string} absPath
     * @returns {string}
     */
    const displayPath = (absPath) => (isUnderHome(absPath) ? '~' + absPath.slice(home.length) : absPath)

    /**
     * @param {string} absPath
     * @returns {string | null}
     */
    const toUrl = (absPath) => (isUnderHome(absPath) ? CONTENT_URL + absPath.slice(home.length) : null)

    /**
     * @param {string} absPath
     * @returns {Promise<Entry[]>}
     */
    const loadManifest = (absPath) =>
        cachedLoad(manifests, absPath, () => io.loadManifest(/** @type {string} */ (toUrl(absPath))))

    /**
     * @param {string} absPath
     * @returns {Promise<Entry>}
     */
    const lookupUnderHome = async (absPath) => {
        let current = home
        /** @type {Entry} */
        let entry = dirEntry(basename(home))
        for (const segment of splitPath(absPath.slice(home.length))) {
            if (entry.type !== 'dir') throw new FsError('ENOTDIR', absPath)
            const entries = await loadManifest(current)
            const found = entries.find((candidate) => candidate.name === segment)
            if (!found) throw new FsError('ENOENT', absPath)
            entry = found
            current = current + '/' + segment
        }
        return entry
    }

    /**
     * @param {string} absPath
     * @returns {Promise<Entry>}
     */
    const stat = async (absPath) => {
        const path = normalize(absPath)
        if (syntheticChild(path) !== null) return dirEntry(basename(path))
        if (!isUnderHome(path)) throw new FsError('ENOENT', path)
        return lookupUnderHome(path)
    }

    /**
     * @param {string} absPath
     * @returns {Promise<Entry[]>}
     */
    const readdir = async (absPath) => {
        const path = normalize(absPath)
        const child = syntheticChild(path)
        if (child !== null) return [dirEntry(child)]
        const entry = await stat(path)
        if (entry.type !== 'dir') throw new FsError('ENOTDIR', path)
        return loadManifest(path)
    }

    /**
     * @param {string} absPath
     * @returns {Promise<string>}
     */
    const readFile = async (absPath) => {
        const path = normalize(absPath)
        const entry = await stat(path)
        if (entry.type === 'dir') throw new FsError('EISDIR', path)
        return cachedLoad(files, path, () => io.loadFile(/** @type {string} */ (toUrl(path))))
    }

    return { home, resolve, displayPath, toUrl, stat, readdir, readFile }
}

export { createVfs }
