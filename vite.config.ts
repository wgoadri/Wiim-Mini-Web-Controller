import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'http'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultTarget = env.VITE_WIIM_HOST || 'https://192.168.1.13'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/wiim': {
          target: defaultTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/wiim/, ''),
          router: (req: IncomingMessage) => {
            const host = req.headers['x-wiim-host']
            return typeof host === 'string' ? host : undefined
          },
        },
      },
    },
  }
})