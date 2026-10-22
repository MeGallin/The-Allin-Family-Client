import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
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
