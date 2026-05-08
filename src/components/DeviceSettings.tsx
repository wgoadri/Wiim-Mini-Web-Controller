import { useState } from 'react'
import { getDeviceInfo } from '../api/wiim'

interface Props {
  host: string
  onHostChange: (host: string) => void
}

type TestState = 'idle' | 'testing' | 'success' | 'failure'

// Returns null if valid, otherwise an error message.
function validateHost(input: string): string | null {
  if (!/^https?:\/\//.test(input)) {
    return 'Host must start with http:// or https://'
  }
  try {
    new URL(input)
    return null
  } catch {
    return 'Invalid URL'
  }
}

export default function DeviceSettings({ host, onHostChange }: Props) {
  const [draft, setDraft] = useState(host)
  const [testState, setTestState] = useState<TestState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function testAndSave() {
    // Empty input is allowed — it falls back to the dev proxy.
    if (draft) {
      const validationError = validateHost(draft)
      if (validationError) {
        setTestState('failure')
        setErrorMessage(validationError)
        return
      }
    }

    setTestState('testing')

    const previous = host
    onHostChange(draft)

    try {
      await getDeviceInfo()
      setTestState('success')
      setErrorMessage('')
    } catch {
      setTestState('failure')
      setErrorMessage('Could not reach device.')
      onHostChange(previous)
    }
  }

  return (
    <details style={{ margin: '24px 0' }}>
      <summary style={{ cursor: 'pointer', fontSize: 14 }}>
        Device settings
      </summary>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13 }}>
          Wiim host (leave empty to use dev proxy)
        </label>
        <input
          type="text"
          value={draft}
          placeholder="https://192.168.1.13"
          onChange={(e) => setDraft(e.target.value)}
          style={{ padding: 8, fontFamily: 'monospace' }}
        />
        <button onClick={testAndSave} disabled={testState === 'testing'}>
          {testState === 'testing' ? 'Testing…' : 'Test & save'}
        </button>
        {testState === 'success' && (
          <p style={{ color: 'green', margin: 0 }}>Connected.</p>
        )}
        {testState === 'failure' && (
          <p style={{ color: 'crimson', margin: 0 }}>{errorMessage}</p>
        )}
      </div>
    </details>
  )
}