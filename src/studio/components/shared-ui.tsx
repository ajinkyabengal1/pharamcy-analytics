import React, {useState, useRef} from 'react'
import {createPortal} from 'react-dom'
import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from 'recharts'
import {fNum} from './ga-constants'

export function InfoIcon({text}: {text: string}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [tip, setTip] = useState<{top: number; left: number; placement: 'top' | 'bottom'} | null>(null)

  const show = () => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const placeBelow = rect.top < 100
    const tipWidth = 230
    const pad = 12
    const centerX = rect.left + rect.width / 2
    const clampedLeft = Math.max(
      tipWidth / 2 + pad,
      Math.min(centerX, window.innerWidth - tipWidth / 2 - pad)
    )

    setTip({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placement: placeBelow ? 'bottom' : 'top',
    })
  }

  const hide = () => setTip(null)

  return (
    <span
      className="ga-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{position: 'relative', display: 'inline-flex', alignItems: 'center'}}
    >
      <button
        ref={triggerRef}
        className="ga-info-btn"
        tabIndex={-1}
        type="button"
        onFocus={show}
        onBlur={hide}
      >
        i
      </button>
      {tip &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: tip.top,
              left: tip.left,
              transform: tip.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              width: 230,
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: 12,
              lineHeight: 1.45,
              padding: '8px 12px',
              borderRadius: 8,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
              border: '1px solid #334155',
              pointerEvents: 'none',
              zIndex: 99999,
              wordWrap: 'break-word',
              whiteSpace: 'normal',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  )
}

export function Skel({
  w,
  h = 14,
  r = 4,
  style,
}: {
  w?: string | number
  h?: number
  r?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      className="ga-skel"
      style={{width: w ?? '100%', height: h, borderRadius: r, flexShrink: 0, ...style}}
    />
  )
}

export function Panel({
  title,
  children,
  info,
  style,
}: {
  title?: string
  children: React.ReactNode
  info?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '20px 22px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {title && (
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
          <span style={{fontSize: 13, fontWeight: 600, color: '#1e293b', letterSpacing: '0.01em'}}>
            {title}
          </span>
          {info && <InfoIcon text={info} />}
        </div>
      )}
      {children}
    </div>
  )
}

export function SectionLabel({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

export function DataTable({
  headers,
  rows,
  empty = 'No data',
  loading,
  skeletonRows = 6,
}: {
  headers: {label: string; align?: 'left' | 'right'; width?: string}[]
  rows: (string | React.ReactNode)[][]
  empty?: string
  loading?: boolean
  skeletonRows?: number
}) {
  return (
    <div style={{width: '100%', overflowX: 'auto'}}>
      <table
        style={{width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed'}}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '6px 10px',
                  textAlign: h.align ?? 'left',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid #f1f5f9',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: h.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({length: skeletonRows}).map((_, ri) => (
              <tr key={ri} style={{borderBottom: '1px solid #f8fafc'}}>
                {headers.map((_h, ci) => (
                  <td key={ci} style={{padding: '9px 10px'}}>
                    <Skel w={ci === 0 ? `${60 + ((ri * 7) % 30)}%` : '70%'} h={12} />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{padding: '28px', textAlign: 'center', color: '#cbd5e1', fontSize: 13}}
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{borderBottom: '1px solid #f8fafc', transition: 'background .1s'}}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '9px 10px',
                      textAlign: headers[ci]?.align ?? 'left',
                      color: ci === 0 ? '#334155' : ci === 1 ? '#1e293b' : '#94a3b8',
                      fontWeight: ci === 1 ? 600 : 400,
                      verticalAlign: 'middle',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Donut({
  data,
  colors,
  info,
  loading,
}: {
  data: {name: string; value: number; percentage: number}[]
  colors: string[]
  info?: string
  loading?: boolean
}) {
  if (loading)
    return (
      <div>
        <div style={{display: 'flex', justifyContent: 'center', padding: '16px 0'}}>
          <div className="ga-skel" style={{width: 120, height: 120, borderRadius: '50%'}} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4}}>
          {Array.from({length: 3}).map((_, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <div
                className="ga-skel"
                style={{width: 8, height: 8, borderRadius: 2, flexShrink: 0}}
              />
              <Skel w={`${50 + i * 12}%`} h={11} />
              <Skel w={30} h={11} style={{marginLeft: 'auto'}} />
            </div>
          ))}
        </div>
      </div>
    )
  if (data.length === 0)
    return (
      <div style={{color: '#cbd5e1', fontSize: 13, padding: '20px 0', textAlign: 'center'}}>
        No data
      </div>
    )
  return (
    <div>
      <div style={{height: 180}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={76}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => fNum(Number(v))}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 7,
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {info && (
        <div style={{fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 12}}>
          {info}
        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
        {data.map((d, i) => (
          <div key={d.name} style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                background: colors[i % colors.length],
                flexShrink: 0,
              }}
            />
            <span style={{flex: 1, fontSize: 13, color: '#475569', textTransform: 'capitalize'}}>
              {d.name}
            </span>
            <span style={{fontSize: 12, color: '#cbd5e1'}}>{d.percentage}%</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {fNum(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricCard({
  label,
  value,
  sub,
  color,
  info,
  loading,
}: {
  label: string
  value: string
  sub?: string
  color: string
  info?: string
  loading?: boolean
}) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        minWidth: 132,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '16px 18px',
        boxSizing: 'border-box',
        transition: 'box-shadow .15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.07)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
    >
      <div style={{display: 'flex', alignItems: 'center', marginBottom: 10}}>
        <span
          style={{
            fontSize: 11,
            color: '#475569',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flex: 1,
          }}
        >
          {label}
        </span>
        {info && <InfoIcon text={info} />}
      </div>
      {loading ? (
        <>
          <Skel w="55%" h={22} r={5} />
          {sub && <Skel w="40%" h={11} style={{marginTop: 6}} />}
        </>
      ) : (
        <>
          <div
            style={{fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: sub ? 4 : 0}}
          >
            {value}
          </div>
          {sub && <div style={{fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 3}}>{sub}</div>}
        </>
      )}
    </div>
  )
}

export function ActiveBadge({count, loading}: {count: number; loading?: boolean}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: '#f0fdf9',
        border: '1px solid #a7f3d0',
        borderRadius: 10,
        padding: '12px 20px',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#10b981',
          animation: 'ga-pulse 2s infinite',
          flexShrink: 0,
        }}
      />
      {loading ? (
        <Skel w={80} h={20} r={5} />
      ) : (
        <span style={{fontSize: 22, fontWeight: 700, color: '#065f46'}}>
          {count.toLocaleString()}
        </span>
      )}
      <span style={{fontSize: 13, color: '#047857'}}>users active right now</span>
      <InfoIcon text="Real-time count of users active on your site in the last 30 minutes." />
    </div>
  )
}

export function PathCell({path}: {path: string}) {
  return (
    <span
      title={path}
      style={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: '#4f8ef7',
        fontSize: 13,
      }}
    >
      {path}
    </span>
  )
}

export function EmptyTab() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300,
        color: '#cbd5e1',
        fontSize: 14,
      }}
    >
      No data to display
    </div>
  )
}

export function SkeletonChart({height}: {height: number}) {
  return (
    <div style={{position: 'relative', height, overflow: 'hidden'}}>
      <Skel w="100%" h={height} r={6} />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 4px 6px',
          gap: 4,
          pointerEvents: 'none',
        }}
      >
        {Array.from({length: 7}).map((_, i) => (
          <Skel key={i} w={32} h={10} r={3} />
        ))}
      </div>
    </div>
  )
}
