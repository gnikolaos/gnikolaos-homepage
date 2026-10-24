import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** @typedef {{ name: string, type: 'dir' } | { name: string, type: 'file', size: number, mtime: string, title: string }} ManifestEntry */

const MANIFEST_NAME = '_manifest.json'

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/dirs')

/**
 * @param {string} name
 * @returns {boolean}
 */
const isHidden = (name) => name.startsWith('.') || name === MANIFEST_NAME

/**
 * @param {string} value
 * @returns {string}
 */
const unquote = (value) => value.replace(/^(['"])(.*)\1$/, '$2')

/**
 * @param {string} content
 * @returns {{ frontmatter: Record<string, string>, body: string }}
 */
const parseFrontmatter = (content) => {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    if (!match) return { frontmatter: {}, body: content }
    /** @type {Record<string, string>} */
    const frontmatter = {}
    for (const line of match[1].split(/\r?\n/)) {
        const field = line.match(/^([\w-]+):\s*(.*)$/)
        if (field) frontmatter[field[1]] = unquote(field[2].trim())
    }
    return { frontmatter, body: content.slice(match[0].length) }
}

/**
 * @param {string} body
 * @returns {string | undefined}
 */
const firstHeading = (body) => body.match(/^# (.+)$/m)?.[1].trim()

/**
 * @param {string | undefined} date
 * @returns {string | undefined}
 */
const toIsoDate = (date) => {
    if (!date) return undefined
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

/**
 * @param {string} filePath
 * @param {string} name
 * @returns {Promise<ManifestEntry>}
 */
const fileEntry = async (filePath, name) => {
    const [content, stats] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)])
    const { frontmatter, body } = parseFrontmatter(content)
    return {
        name,
        type: 'file',
        size: stats.size,
        mtime: toIsoDate(frontmatter.date) ?? stats.mtime.toISOString(),
        title: frontmatter.title || firstHeading(body) || name,
    }
}

/**
 * @param {ManifestEntry} a
 * @param {ManifestEntry} b
 * @returns {number}
 */
const compareEntries = (a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    if (a.name === b.name) return 0
    return a.name < b.name ? -1 : 1
}

/**
 * @param {string} filePath
 * @param {string} content
 */
const writeIfChanged = async (filePath, content) => {
    const current = await readFile(filePath, 'utf8').catch(() => null)
    if (current !== content) await writeFile(filePath, content)
}

/**
 * @param {string} dir
 * @param {string[]} written
 */
const generateDir = async (dir, written) => {
    const dirents = (await readdir(dir, { withFileTypes: true })).filter((dirent) => !isHidden(dirent.name))
    const subdirs = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
    const markdownFiles = dirents
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.md'))
        .map((dirent) => dirent.name)

    /** @type {ManifestEntry[]} */
    const entries = [
        ...subdirs.map((name) => /** @type {ManifestEntry} */ ({ name, type: 'dir' })),
        ...(await Promise.all(markdownFiles.map((name) => fileEntry(path.join(dir, name), name)))),
    ].sort(compareEntries)

    const manifestPath = path.join(dir, MANIFEST_NAME)
    await writeIfChanged(manifestPath, JSON.stringify({ entries }, null, 4) + '\n')
    written.push(manifestPath)

    for (const name of subdirs) await generateDir(path.join(dir, name), written)
}

/**
 * @param {string} [rootDir]
 * @returns {Promise<string[]>} manifest paths
 */
const generateManifests = async (rootDir = defaultRoot) => {
    /** @type {string[]} */
    const written = []
    await generateDir(rootDir, written)
    return written
}

const isExecutedDirectly = () => Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href

if (isExecutedDirectly()) {
    const written = await generateManifests(process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot)
    process.stdout.write(`Generated ${written.length} manifest(s)\n`)
}

export { generateManifests, defaultRoot }
