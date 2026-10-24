import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { generateManifests } from './generateDirManifest.js'

/** @type {string} */
let root

/**
 * @param {string} relativePath
 * @param {string} content
 * @returns {Promise<string>}
 */
const write = async (relativePath, content) => {
    const filePath = path.join(root, relativePath)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, content)
    return filePath
}

/**
 * @param {string} [relativeDir]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
const readManifest = async (relativeDir = '') =>
    JSON.parse(await readFile(path.join(root, relativeDir, '_manifest.json'), 'utf8')).entries

/**
 * @param {string} [relativeDir]
 * @returns {Promise<unknown[]>}
 */
const manifestNames = async (relativeDir) => (await readManifest(relativeDir)).map((entry) => entry.name)

beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'dir-manifest-'))
})

afterEach(async () => {
    await rm(root, { recursive: true, force: true })
})

describe('generateManifests', () => {
    test('sorts dirs first, then files, each alphabetically', async () => {
        await write('zeta.md', '# Z')
        await write('alpha.md', '# A')
        await write('posts/a.md', '# P')
        await mkdir(path.join(root, 'about-me'))
        await generateManifests(root)
        expect(await manifestNames()).toEqual(['about-me', 'posts', 'alpha.md', 'zeta.md'])
        expect((await readManifest())[0]).toEqual({ name: 'about-me', type: 'dir' })
    })

    test('writes a manifest for every nested dir, including empty ones', async () => {
        await write('posts/2026/deep.md', '# Deep')
        await mkdir(path.join(root, 'projects'))
        const written = await generateManifests(root)
        expect(written.map((file) => path.relative(root, file)).sort()).toEqual([
            '_manifest.json',
            path.join('posts', '2026', '_manifest.json'),
            path.join('posts', '_manifest.json'),
            path.join('projects', '_manifest.json'),
        ])
        expect(await manifestNames('posts')).toEqual(['2026'])
        expect(await manifestNames('posts/2026')).toEqual(['deep.md'])
        expect(await readManifest('projects')).toEqual([])
    })

    test('lists only markdown files and skips dotfiles and manifests', async () => {
        await write('a.md', '# A')
        await write('notes.txt', 'x')
        await write('image.png', 'x')
        await write('.hidden.md', '# Hidden')
        await write('.git/config.md', '# Config')
        await write('projects/.gitkeep', '')
        await generateManifests(root)
        await generateManifests(root)
        expect(await manifestNames()).toEqual(['projects', 'a.md'])
        expect(await readManifest('projects')).toEqual([])
    })

    test('title comes from frontmatter, then the first h1, then the file name', async () => {
        await write('front.md', '---\ntitle: "Front title"\n---\n# Heading\n')
        await write('heading.md', 'intro\n## Sub\n# Real heading\n')
        await write('plain.md', 'no headings here\n## only h2\n')
        await write('empty-title.md', '---\ntitle:\n---\n# Fallback heading\n')
        await generateManifests(root)
        const titles = Object.fromEntries((await readManifest()).map((entry) => [entry.name, entry.title]))
        expect(titles).toEqual({
            'empty-title.md': 'Fallback heading',
            'front.md': 'Front title',
            'heading.md': 'Real heading',
            'plain.md': 'plain.md',
        })
    })

    test('mtime comes from frontmatter date, else the file mtime', async () => {
        await write('dated.md', "---\ndate: '2025-03-30'\n---\n# Dated\n")
        await write('bad-date.md', '---\ndate: someday\n---\n# Bad\n')
        const undated = await write('undated.md', '# Undated\n')
        const fileTime = new Date('2024-01-02T03:04:05.000Z')
        await utimes(undated, fileTime, fileTime)
        await utimes(path.join(root, 'bad-date.md'), fileTime, fileTime)
        await generateManifests(root)
        const mtimes = Object.fromEntries((await readManifest()).map((entry) => [entry.name, entry.mtime]))
        expect(mtimes).toEqual({
            'bad-date.md': fileTime.toISOString(),
            'dated.md': '2025-03-30T00:00:00.000Z',
            'undated.md': fileTime.toISOString(),
        })
    })

    test('size is the byte length of the file', async () => {
        await write('greek.md', '# Γειά')
        await generateManifests(root)
        expect((await readManifest())[0]).toMatchObject({ name: 'greek.md', type: 'file', size: 10 })
    })

    test('reflects removed files on regeneration', async () => {
        await write('a.md', '# A')
        const b = await write('b.md', '# B')
        await generateManifests(root)
        await rm(b)
        await generateManifests(root)
        expect(await manifestNames()).toEqual(['a.md'])
    })
})
