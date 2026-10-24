/// <reference types="vitest/config" />
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import dirManifestPlugin from './automation/dirManifestPlugin.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    plugins: [tailwindcss(), solidPlugin(), dirManifestPlugin()],
    resolve: {
        alias: {
            '@gnikolaos': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        target: 'esnext',
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.js', 'automation/**/*.test.js'],
    },
})
