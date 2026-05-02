import { useState } from 'react'
import { getDeviceInfo } from '../api/wiim'

interface Props {
  host: string
  onHostChange: (host: string) => void
}

type TestState = 'idle' | 'testing' | 'success' | 'failure'

export default function DeviceSettings({ host, onHostChange }: Props) {
  const [draft, setDraft] = useState(host)
  const [testState, setTestState] = useState<TestState>('idle')

  async function testAndSave() {
    setTestState('testing')

    // Apply the draft host temporarily, then probe the device.
    const previous = host
    onHostChange(draft)

    try {
      await getDeviceInfo()
      setTestState('success')
    } catch {
      setTestState('failure')
      onHostChange(previous) // revert on failure
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
        {testState === 'success' && <p style={{ color: 'green', margin: 0 }}>Connected.</p>}
        {testState === 'failure' && <p style={{ color: 'crimson', margin: 0 }}>Could not reach device.</p>}
      </div>
    </details>
  )
}