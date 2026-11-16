import React, {useCallback, useEffect, useState} from 'react'
import {Copy, Info, RefreshCw} from 'lucide-react'

export interface MissingKey {
  key: string
  description: string
}
export interface ConfigGroup {
  id: 'ga' | 'search-console' | 'custom'
  label: string
  missing: MissingKey[]
}

/** Asks the analytics API route which required env keys are missing (names only, never values). */
export function useConfigStatus(apiUrl: string) {
  const [groups, setGroups] = useState<ConfigGroup[] | null>(null)
  const [checking, setChecking] = useState(false)

  const refresh = useCallback(async () => {
    setChecking(true)
    try {
      const r = await fetch(`${apiUrl}?mode=config-status`, {cache: 'no-store'})
      const d = r.ok ? ((await r.json()) as {groups?: ConfigGroup[]}) : null
      setGroups(d?.groups ?? [])
    } catch {
      setGroups([])
    } finally {
      setChecking(false)
    }
  }, [apiUrl])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-check while keys are missing (and when the tab regains focus) so the card updates by itself.
  const hasMissing = (groups ?? []).some((g) => g.missing.length > 0)
  useEffect(() => {
    if (!hasMissing) return
    const timer = setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [hasMissing, refresh])

  return {groups, checking, refresh}
}

/** Info card shown instead of an empty dashboard when required keys are not configured. */
export function MissingKeysCard({
  groups,
  checking,
  onCheckAgain,
}: {
  groups: ConfigGroup[]
  checking: boolean
  onCheckAgain: () => void
}) {
  const [copied, setCopied] = useState(false)
  const keyNames = [...new Set(groups.flatMap((g) => g.missing.map((m) => m.key)))]
  const snippet = keyNames.map((k) => `${k}=`).join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable; the snippet is still visible */
    }
  }

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 40,
    padding: '0 18px',
    border: 0,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  }

  return (
    <div style={{flex: 1, display: 'grid', placeItems: 'center', padding: 24, overflowY: 'auto'}}>
      <div
        role="dialog"
        aria-label="Analytics keys not configured"
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#fff',
          border: '1px solid #eceef2',
          borderRadius: 20,
          padding: 28,
          color: '#0f172a',
          boxShadow: '0 24px 60px rgba(15,23,42,.12)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
              boxShadow: '0 14px 28px rgba(37,99,235,.18)',
            }}
          >
            <Info size={19} />
          </div>
          <div style={{fontSize: 18, fontWeight: 850, color: '#0f172a'}}>Analytics keys not configured</div>
        </div>

        <div style={{fontSize: 13, color: '#667085', lineHeight: 1.6, marginBottom: 14}}>
          Add the following keys to this website's environment to start seeing analytics.
        </div>

        {groups.map((g) => (
          <div key={g.id} style={{marginBottom: 12}}>
            <div style={{fontSize: 13, fontWeight: 800, color: '#0f172a'}}>{g.label}</div>
            <ul style={{margin: '4px 0 0 18px', padding: 0, fontSize: 13, color: '#475467', lineHeight: 1.6}}>
              {g.missing.map((m) => (
                <li key={m.key}>
                  <code style={{color: '#0f172a', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4}}>{m.key}</code> — {m.description}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{fontSize: 12, color: '#667085', margin: '4px 0 6px'}}>
          Add to <code style={{color: '#0f172a'}}>.env.local</code> (and your hosting environment), then redeploy:
        </div>
        <pre
          style={{
            margin: '0 0 16px',
            padding: 10,
            background: '#f8fafc',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 12,
            overflowX: 'auto',
          }}
        >
          {snippet}
        </pre>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
          <button type="button" onClick={copy} style={{...btn, background: '#0f172a', color: '#fff'}}>
            <Copy size={15} />
            <span>{copied ? 'Copied' : 'Copy .env snippet'}</span>
          </button>
          <button type="button" onClick={onCheckAgain} disabled={checking} style={{...btn, background: '#f1f5f9', color: '#0f172a'}}>
            <RefreshCw size={15} />
            <span>{checking ? 'Checking…' : 'Check again'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
