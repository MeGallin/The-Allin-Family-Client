import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CLIENT_VERSION_ENV,
  CLIENT_VERSION_MANIFEST,
  nextClientVersion,
} from './scripts/client-version.mjs'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const version = command === 'build' ? process.env[CLIENT_VERSION_ENV] : undefined
  if (
    command === 'build' &&
    version !==
      nextClientVersion(
        JSON.parse(readFileSync(resolve(process.cwd(), 'src/app-version.json'), 'utf8')).version,
      )
  )
    throw new Error('Build the client with npm run build so its version advances exactly once.')

  return {
    define: version ? { __CLIENT_BUILD_VERSION__: JSON.stringify(version) } : {},
    plugins: [
      react(),
      {
        name: 'client-build-version-manifest',
        apply: 'build',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: CLIENT_VERSION_MANIFEST,
            source: JSON.stringify({ version }) + '\n',
          })
        },
      },
      {
        name: 'canonical-local-navigation',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            // Keep the browser on the origin expected by local sessions and CSRF checks.
            // This middleware runs only in development, never in the deployed client.
            if (
              /^(GET|HEAD)$/.test(request.method || '') &&
              request.headers.host === `localhost:${server.config.server.port}` &&
              request.headers.accept?.includes('text/html')
            ) {
              response.writeHead(302, {
                Location: `http://127.0.0.1:${server.config.server.port}${request.url || '/'}`,
              })
              response.end()
              return
            }
            next()
          })
        },
      },
    ],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
          rewrite: (path) => path.replace(/^\/api(?=\/|$)/, '') || '/',
        },
      },
    },
  }
})
