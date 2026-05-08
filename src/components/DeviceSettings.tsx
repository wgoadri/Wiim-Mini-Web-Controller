import { useState } from 'react'
import { testHost } from '../api/wiim'

interface Props {
  host: string
  onHostChange: (host: string) => void
}

type TestState = 'idle' | 'testing' | 'success' | 'failure'

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
    if (draft) {
      const validationError = validateHost(draft)
      if (validationError) {
        setTestState('failure')
        setErrorMessage(validationError)
        return
      }
    }

    setTestState('testing')
    setErrorMessage('')

    try {
      // Test against the draft host directly — does NOT touch global state.
      await testHost(draft || null)
      // Only commit on success. No revert logic needed.
      onHostChange(draft)
      setTestState('success')
    } catch {
      setTestState('failure')
      setErrorMessage('Could not reach device.')
    }
  }

  return (
    <details className="mt-8 rounded-xl bg-surface p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-medium text-muted">
        Device settings
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-muted">
          Wiim host (leave empty to use dev proxy)
        </label>
        <input
          type="text"
          value={draft}
          placeholder="https://192.168.1.13"
          onChange={(e) => setDraft(e.target.value)}
          className="rounded-lg border border-muted/30 bg-bg px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
        />
        <button
          onClick={testAndSave}
          disabled={testState === 'testing'}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition active:scale-95 disabled:opacity-50"
        >
          {testState === 'testing' ? 'Testing…' : 'Test & save'}
        </button>
        {testState === 'success' && (
          <p className="text-sm text-emerald-700">Connected.</p>
        )}
        {testState === 'failure' && (
          <p className="text-sm text-danger">{errorMessage}</p>
        )}
      </div>
    </details>
  )
}