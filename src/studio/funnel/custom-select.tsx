import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'

export interface CustomSelectOption {
  value: string
  label: string
  badge?: string
  badgeColor?: string
}

export interface CustomSelectProps {
  label: string
  value: string
  options: CustomSelectOption[]
  placeholder: string
  disabled?: boolean
  loading?: boolean
  onChange: (value: string) => void
}

export function CustomSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  onChange,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  )

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40)
    else setSearch('')
  }, [open])

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val)
      setOpen(false)
    },
    [onChange],
  )

  const isDisabled = disabled || loading

  return (
    <div ref={ref} style={{position: 'relative', flex: '1 1 200px', maxWidth: 300}}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#aaa',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isDisabled) setOpen((o) => !o)
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          background: isDisabled ? '#f9fafb' : '#fff',
          border: `1.5px solid ${open ? '#6366f1' : '#e2e6ea'}`,
          borderRadius: 10,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: selected ? '#111' : '#aaa',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {loading ? (
            <span style={{display: 'flex', alignItems: 'center', gap: 8, color: '#aaa'}}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid #e2e6ea',
                  borderTopColor: '#6366f1',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Loading…
            </span>
          ) : selected ? (
            selected.label
          ) : (
            placeholder
          )}
        </span>
        {selected && !isDisabled && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              setOpen(false)
            }}
            style={{
              fontSize: 12,
              color: '#bbb',
              padding: '0 2px',
              borderRadius: 4,
              cursor: 'pointer',
              flexShrink: 0,
              lineHeight: 1,
            }}
            title="Clear"
          >
            ✕
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            color: '#aaa',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: '#fff',
            border: '1.5px solid #e2e6ea',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {options.length > 6 && (
            <div style={{padding: '10px 12px', borderBottom: '1px solid #f0f2f5'}}>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: 12,
                  border: '1.5px solid #e2e6ea',
                  borderRadius: 7,
                  outline: 'none',
                  background: '#f8f9fb',
                  color: '#111',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{maxHeight: 220, overflowY: 'auto'}}>
            {filtered.length === 0 ? (
              <div
                style={{padding: '14px 16px', fontSize: 12, color: '#aaa', textAlign: 'center'}}
              >
                No results
              </div>
            ) : (
              filtered.map((opt) => {
                const isActive = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 14px',
                      background: isActive ? '#f0f1fe' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f5f6f8',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLDivElement).style.background = '#f8f9fb'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: isActive ? '#4f46e5' : '#222',
                        fontWeight: isActive ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 20,
                          background:
                            opt.badgeColor === 'nhs'
                              ? '#dbeafe'
                              : opt.badgeColor === 'private'
                                ? '#fef3c7'
                                : '#f3f4f6',
                          color:
                            opt.badgeColor === 'nhs'
                              ? '#1d4ed8'
                              : opt.badgeColor === 'private'
                                ? '#92400e'
                                : '#666',
                          flexShrink: 0,
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                    {isActive && (
                      <span style={{fontSize: 13, color: '#4f46e5', flexShrink: 0}}>✓</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
