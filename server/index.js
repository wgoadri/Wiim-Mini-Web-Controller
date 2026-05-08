import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PORT || 3000
const WIIM_HOST = process.env.WIIM_HOST || 'https://192.168.1.13'

const app = express()

// Forward Wiim API calls. secure:false handles the self-signed cert,
// same as Vite's dev proxy.
app.use(
  '/api/wiim',
  createProxyMiddleware({
    target: WIIM_HOST,
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/api/wiim': '' },
    proxyTimeout: 5000,
  }),
)

// Serve the built React app from dist/.
app.use(express.static(path.join(__dirname, '..', 'dist')))

app.listen(PORT, () => {
  console.log(`Wiim Controller listening on http://localhost:${PORT}`)
  console.log(`Forwarding /api/wiim/* to ${WIIM_HOST}`)
})