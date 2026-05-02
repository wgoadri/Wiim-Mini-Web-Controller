import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_WIIM_HOST || 'https://192.168.1.13'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/wiim': {
          target,
          changeOrigin: true,
          secure: false, // Wiim uses a self-signed cert
          rewrite: (path) => path.replace(/^\/api\/wiim/, ''),
        },
      },
    },
  }
})