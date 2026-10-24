import path from 'node:path'
import { defaultRoot, generateManifests } from './generateDirManifest.js'

/**
 * @param {string} root
 * @param {string} file
 * @returns {boolean}
 */
const isContentFile = (root, file) => file.endsWith('.md') && !path.relative(root, file).startsWith('..')

/**
 * @param {{ root?: string }} [options]
 * @returns {import('vite').Plugin}
 */
const dirManifestPlugin = ({ root = defaultRoot } = {}) => ({
    name: 'dir-manifest',
    async configResolved() {
        await generateManifests(root)
    },
    configureServer(server) {
        /** @param {string} file */
        const regenerate = async (file) => {
            if (!isContentFile(root, file)) return
            try {
                await generateManifests(root)
                server.ws.send({ type: 'full-reload' })
            } catch (error) {
                server.config.logger.error(`[dir-manifest] ${error instanceof Error ? error.message : error}`)
            }
        }
        server.watcher.add(root)
        for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, regenerate)
    },
})

export default dirManifestPlugin
