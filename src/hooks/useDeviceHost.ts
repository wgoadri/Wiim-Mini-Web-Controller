import { useEffect, useState } from 'react'
import { setHost } from '../api/wiim'

const STORAGE_KEY = 'wiim:host'

export function useDeviceHost() {
  const [host, setHostState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  })

  // Push changes into the API module and persist them.
  useEffect(() => {
    if (host) {
      setHost(host)
      localStorage.setItem(STORAGE_KEY, host)
    } else {
      setHost(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [host])

  return [host, setHostState] as const
}