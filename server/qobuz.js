const QOBUZ_BASE = 'https://www.qobuz.com/api.json/0.2'

// Returns config if Qobuz env vars are set, null otherwise.
// Allows running the app without Qobuz configured.
export function getQobuzConfig() {
  const appId = process.env.QOBUZ_APP_ID
  const userAuthToken = process.env.QOBUZ_USER_AUTH_TOKEN

  if (!appId || !userAuthToken) return null
  return { appId, userAuthToken }
}

export async function search(query, config, limit = 10) {
  const url = new URL(`${QOBUZ_BASE}/catalog/search`)
  url.searchParams.set('query', query)
  url.searchParams.set('limit', String(limit))

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
      throw new Error(`Qobuz API ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}