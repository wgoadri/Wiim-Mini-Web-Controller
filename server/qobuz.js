import { createHash } from 'node:crypto'

const QOBUZ_BASE = 'https://www.qobuz.com/api.json/0.2'

export function getQobuzConfig() {
  const appId = process.env.QOBUZ_APP_ID
  const userAuthToken = process.env.QOBUZ_USER_AUTH_TOKEN
  const appSecret = process.env.QOBUZ_APP_SECRET

  if (!appId || !userAuthToken) return null
  return { appId, userAuthToken, appSecret: appSecret ?? null }
}

async function qobuzGet(path, params, config) {
  const url = new URL(`${QOBUZ_BASE}/${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      headers: {
        'X-App-Id': config.appId,
        'X-User-Auth-Token': config.userAuthToken,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Qobuz API ${response.status}: ${body.slice(0, 200)}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export function search(query, config, limit = 10) {
  return qobuzGet('catalog/search', { query, limit }, config)
}

// Resolves a Qobuz track ID to a signed stream URL.
// Format IDs (per qopy): 5 = MP3 320, 6 = FLAC 16/44, 7 = FLAC 24/96, 27 = FLAC 24/192.
// Default to 5 — most likely to play on any device, smallest bandwidth.
export async function getTrackUrl(trackId, config, formatId = 5) {
  if (!config.appSecret) {
    throw new Error('QOBUZ_APP_SECRET is required to resolve stream URLs')
  }

  const ts = Math.floor(Date.now() / 1000)

  // Endpoint-specific signing formula. Same as qobuz-dl/qopy.
  // Params sorted alphabetically: format_id, intent, track_id.
  const sigData =
    `trackgetFileUrl` +
    `format_id${formatId}` +
    `intentstream` +
    `track_id${trackId}` +
    ts +
    config.appSecret

  const sig = createHash('md5').update(sigData).digest('hex')

  return qobuzGet(
    'track/getFileUrl',
    {
      track_id: trackId,
      format_id: formatId,
      intent: 'stream',
      request_ts: ts,
      request_sig: sig,
    },
    config,
  )
}