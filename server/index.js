import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getQobuzConfig, search as qobuzSearch } from './qobuz.js'

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

const qobuzConfig = getQobuzConfig()

if (qobuzConfig) {
  console.log('Qobuz integration enabled')

  app.get('/api/qobuz/search', async (req, res) => {
    const query = req.query.q
    if (typeof query !== 'string' || !query) {
      return res.status(400).json({ error: 'Missing query parameter "q"' })
    }

    try {
      const result = await qobuzSearch(query, qobuzConfig)
      res.json(result)
    } catch (error) {
      res.status(502).json({ error: error.message })
    }
  })
} else {
  console.log('Qobuz integration disabled (QOBUZ_APP_ID and QOBUZ_USER_AUTH_TOKEN not set)')
}