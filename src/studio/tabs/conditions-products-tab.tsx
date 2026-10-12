import React, {useEffect, useMemo, useState} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {DateRange} from '../ga-types'
import {
  fetchTopEntities,
  fetchTopSearches,
  type TopEntitiesResponse,
  type TopSearchesResponse,
} from '../utils-mixpanel-api'
import {MIXPANEL_API_URL} from '../funnel/constants'
import {fNum, PALETTE} from '../components/ga-constants'
import {MetricCard, SkeletonChart} from '../components/shared-ui'

type SubTab = 'conditions' | 'products'

const SERVICE_COLORS: Record<string, string> = {
  NHS: '#10b981',
  'Private Service': '#6366f1',
  'Private Medication': '#f59e0b',
}

function shortLabel(name: string, max = 16): string {
  return name.length > max ? name.slice(0, max) + '…' : name
}

function RotatedTick(props: {x?: string | number; y?: string | number; payload?: {value: string}; [key: string]: unknown}) {
  const {x = 0, y = 0, payload} = props
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#64748b"
        fontSize={10}
        transform="rotate(-38)"
      >
        {payload?.value ?? ''}
      </text>
    </g>
  )
}

function EmptyState({label}: {label: string}) {
  return (
    <div
      style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#cbd5e1',
        fontSize: 13,
        fontStyle: 'italic',
      }}
    >
      {label}
    </div>
  )
}

export function ConditionsProductsTab({dateRange}: {apiUrl?: string; dateRange: DateRange}) {
  const [subTab, setSubTab] = useState<SubTab>('conditions')
  const [data, setData] = useState<TopEntitiesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchTick, setFetchTick] = useState(0)

  const [topConditionSearches, setTopConditionSearches] = useState<TopSearchesResponse | null>(null)
  const [topConditionSearchesLoading, setTopConditionSearchesLoading] = useState(true)
  const [conditionSearchVisible, setConditionSearchVisible] = useState(20)
  const [topProductSearches, setTopProductSearches] = useState<TopSearchesResponse | null>(null)
  const [topProductSearchesLoading, setTopProductSearchesLoading] = useState(true)
  const [productSearchVisible, setProductSearchVisible] = useState(20)

  useEffect(() => {
    const controller = new AbortController()
    setTopConditionSearchesLoading(true)
    fetchTopSearches(MIXPANEL_API_URL, dateRange, 'condition', controller.signal)
      .then((res) => { if (!controller.signal.aborted) setTopConditionSearches(res) })
      .catch((err) => { if (err instanceof Error && err.name === 'AbortError') return })
      .finally(() => { if (!controller.signal.aborted) setTopConditionSearchesLoading(false) })
    return () => controller.abort()
  }, [dateRange, fetchTick])

  useEffect(() => {
    const controller = new AbortController()
    setTopProductSearchesLoading(true)
    fetchTopSearches(MIXPANEL_API_URL, dateRange, 'product', controller.signal)
      .then((res) => { if (!controller.signal.aborted) setTopProductSearches(res) })
      .catch((err) => { if (err instanceof Error && err.name === 'AbortError') return })
      .finally(() => { if (!controller.signal.aborted) setTopProductSearchesLoading(false) })
    return () => controller.abort()
  }, [dateRange, fetchTick])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchTopEntities(MIXPANEL_API_URL, dateRange, undefined, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setData(res)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [dateRange, fetchTick])

  const conditionBarData = useMemo(
    () =>
      [...(data?.conditions ?? [])]
        .sort((a, b) => b.condition_viewed - a.condition_viewed)
        .filter((c) => c.condition_viewed > 0)
        .slice(0, 12)
        .map((c) => ({fullName: c.name, name: shortLabel(c.name), Views: c.condition_viewed})),
    [data],
  )

  const pieData = useMemo(() => {
    const sb = data?.serviceBreakdown ?? {nhs: 0, private_service: 0, private_medication: 0}
    return [
      {name: 'NHS', value: sb.nhs, color: SERVICE_COLORS['NHS']},
      {name: 'Private Service', value: sb.private_service, color: SERVICE_COLORS['Private Service']},
      {name: 'Private Medication', value: sb.private_medication, color: SERVICE_COLORS['Private Medication']},
    ].filter((e) => e.value > 0)
  }, [data])

  const productBarData = useMemo(
    () =>
      [...(data?.products ?? [])]
        .sort((a, b) => b.product_viewed - a.product_viewed)
        .filter((p) => p.product_viewed > 0)
        .slice(0, 12)
        .map((p) => ({fullName: p.name, name: shortLabel(p.name), Views: p.product_viewed})),
    [data],
  )

  const uniqueConditions = data?.conditions?.length ?? 0
  const uniqueProducts = data?.products?.length ?? 0
  const totalConditionViews = (data?.conditions ?? []).reduce((s, c) => s + c.condition_viewed, 0)
  const totalProductViews = (data?.products ?? []).reduce((s, p) => s + p.product_viewed, 0)

  if (error) {
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: 18,
          color: '#991b1b',
          fontSize: 13,
        }}
      >
        Failed to load conditions &amp; products analytics: {error}
      </div>
    )
  }

  const barTooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,.08)',
  }

  return (
    <div style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}>
      {/* ── Sub-tab switcher ── */}
      <div
        style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 12,
          padding: 4,
          gap: 4,
          width: 'fit-content',
        }}
      >
        {(['conditions', 'products'] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              padding: '8px 24px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: subTab === tab ? '#fff' : 'transparent',
              color: subTab === tab ? '#1e293b' : '#64748b',
              boxShadow: subTab === tab ? '0 1px 8px rgba(0,0,0,.12)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'conditions' ? '💊  Conditions' : '📦  Products'}
          </button>
        ))}
      </div>

      {/* ── Conditions sub-tab ── */}
      {subTab === 'conditions' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          {/* KPI */}
          <MetricCard
            label="Unique Conditions"
            value={loading ? '—' : fNum(uniqueConditions)}
            sub={loading ? undefined : `${fNum(totalConditionViews)} total views`}
            color="#6366f1"
            info="Distinct conditions with at least one tracked event in this range."
            loading={loading}
          />

          {/* Charts row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 2fr',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            {/* Vertical bar chart */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px 16px 12px 16px',
                boxShadow: '0 1px 6px rgba(0,0,0,.04)',
              }}
            >
              <div
                style={{fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4}}
              >
                Condition Views
              </div>
              <div style={{fontSize: 11, color: '#94a3b8', marginBottom: 16}}>
                Top conditions by <code>condition_viewed</code> count
              </div>
              {loading ? (
                <SkeletonChart height={300} />
              ) : conditionBarData.length === 0 ? (
                <EmptyState label="No conditions with views in this range." />
              ) : (
                <div style={{height: 300}}>
                  <ResponsiveContainer>
                    <BarChart
                      data={conditionBarData}
                      margin={{top: 8, right: 12, left: -8, bottom: 72}}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={RotatedTick}
                        interval={0}
                        height={72}
                        tickLine={false}
                        axisLine={{stroke: '#e2e8f0'}}
                      />
                      <YAxis
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(v: unknown) => [fNum(Number(v ?? 0)), 'Views'] as [string, string]}
                        labelFormatter={(label: React.ReactNode, payload: ReadonlyArray<{payload?: {fullName?: string}}>) =>
                          (payload?.[0]?.payload?.fullName ?? label) as string
                        }
                        contentStyle={barTooltipStyle}
                        cursor={{fill: 'rgba(99,102,241,0.06)'}}
                      />
                      <Bar dataKey="Views" radius={[5, 5, 0, 0]} maxBarSize={44}>
                        {conditionBarData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie chart — service type */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px 16px 12px 16px',
                boxShadow: '0 1px 6px rgba(0,0,0,.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4}}>
                Service Type Breakdown
              </div>
              <div style={{fontSize: 11, color: '#94a3b8', marginBottom: 8}}>
                Based on condition views
              </div>
              {loading ? (
                <SkeletonChart height={300} />
              ) : pieData.length === 0 ? (
                <EmptyState label="No service type data available." />
              ) : (
                <>
                  <div style={{flex: 1, minHeight: 220}}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="44%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          paddingAngle={3}
                          label={({percent = 0}: {percent?: number}) =>
                            percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''
                          }
                          labelLine={false}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: unknown) => [fNum(Number(v ?? 0)), 'Views']}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 16px rgba(0,0,0,.08)',
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={9}
                          wrapperStyle={{fontSize: 12, paddingTop: 8}}
                          formatter={(value: string) => (
                            <span style={{color: '#334155'}}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Summary pills */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 8,
                      justifyContent: 'center',
                    }}
                  >
                    {pieData.map((entry) => (
                      <span
                        key={entry.name}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: `${entry.color}18`,
                          border: `1px solid ${entry.color}40`,
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: 11,
                          color: '#334155',
                          fontWeight: 500,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: entry.color,
                            flexShrink: 0,
                          }}
                        />
                        {entry.name}: {fNum(entry.value)}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>


          {/* Top Searched Conditions */}
          <div style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px'}}>
            <div style={{fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12}}>
              Top Searched Conditions
            </div>
            {topConditionSearchesLoading ? (
              <SkeletonChart height={180} />
            ) : !topConditionSearches?.topSearches?.length ? (
              <EmptyState label="No condition search data yet." />
            ) : (
              <>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
                  <thead>
                    <tr>
                      <th style={{textAlign: 'left', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>#</th>
                      <th style={{textAlign: 'left', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>Search Term</th>
                      <th style={{textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topConditionSearches.topSearches.slice(0, conditionSearchVisible).map((row, i) => (
                      <tr key={row.term} style={{background: i % 2 === 0 ? '#f8fafc' : '#fff'}}>
                        <td style={{padding: '6px 8px', color: '#94a3b8', fontWeight: 700, fontSize: 11}}>{i + 1}</td>
                        <td style={{padding: '6px 8px', color: '#1e293b', fontWeight: 500}}>{row.term}</td>
                        <td style={{padding: '6px 8px', textAlign: 'right', color: '#6366f1', fontWeight: 700}}>{fNum(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topConditionSearches.topSearches.length > conditionSearchVisible && (
                  <div style={{textAlign: 'center', marginTop: 10}}>
                    <button
                      onClick={() => setConditionSearchVisible((v) => v + 10)}
                      style={{
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '6px 18px',
                        fontSize: 12,
                        color: '#6366f1',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Show {Math.min(10, topConditionSearches.topSearches.length - conditionSearchVisible)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Products sub-tab ── */}
      {subTab === 'products' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          {/* KPI + category tiles side-by-side */}
          <div style={{display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap'}}>
            {/* Unique Products card */}
            <div style={{flex: '0 0 auto', minWidth: 200}}>
              <MetricCard
                label="Unique Products"
                value={loading ? '—' : fNum(uniqueProducts)}
                sub={loading ? undefined : `${fNum(totalProductViews)} total views`}
                color="#10b981"
                info="Distinct products with at least one tracked event in this range."
                loading={loading}
              />
            </div>

            {/* Category type tiles */}
            {(loading || Object.keys(data?.productCategoryBreakdown ?? {}).length > 0) && (
              <div style={{flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px'}}>
                <div style={{fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12}}>
                  Views by Category Type
                </div>
                <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
                  {loading
                    ? [0, 1, 2].map((i) => (
                        <div key={i} style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '12px 16px',
                          flex: '0 0 160px',
                        }}>
                          <div style={{width: 72, height: 9, background: '#f1f5f9', borderRadius: 6, marginBottom: 10}} />
                          <div style={{width: 40, height: 26, background: '#f1f5f9', borderRadius: 8}} />
                        </div>
                      ))
                    : Object.entries(data!.productCategoryBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, count], i) => {
                          const color = PALETTE[i % PALETTE.length]
                          const label = cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          return (
                            <div
                              key={cat}
                              style={{
                                background: '#fff',
                                border: `1.5px solid ${color}35`,
                                borderTop: `3px solid ${color}`,
                                borderRadius: 12,
                                padding: '12px 16px 14px',
                                flex: '0 0 160px',
                                boxShadow: `0 2px 6px ${color}12`,
                              }}
                            >
                              <div style={{fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {label}
                              </div>
                              <div style={{fontSize: 26, fontWeight: 800, color, lineHeight: 1}}>
                                {fNum(count)}
                              </div>
                              <div style={{fontSize: 11, color: '#cbd5e1', marginTop: 3}}>views</div>
                            </div>
                          )
                        })}
                </div>
              </div>
            )}
          </div>

          {/* Vertical bar chart */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '20px 16px 12px 16px',
              boxShadow: '0 1px 6px rgba(0,0,0,.04)',
            }}
          >
            <div style={{fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4}}>
              Product Views
            </div>
            <div style={{fontSize: 11, color: '#94a3b8', marginBottom: 16}}>
              Top products by <code>product_viewed</code> count
            </div>
            {loading ? (
              <SkeletonChart height={340} />
            ) : productBarData.length === 0 ? (
              <EmptyState label="No products with views in this range." />
            ) : (
              <div style={{height: 340}}>
                <ResponsiveContainer>
                  <BarChart
                    data={productBarData}
                    margin={{top: 8, right: 12, left: -8, bottom: 80}}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={RotatedTick}
                      interval={0}
                      height={80}
                      tickLine={false}
                      axisLine={{stroke: '#e2e8f0'}}
                    />
                    <YAxis
                      tick={{fontSize: 10, fill: '#94a3b8'}}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(v: unknown) => [fNum(Number(v ?? 0)), 'Views'] as [string, string]}
                      labelFormatter={(label: React.ReactNode, payload: ReadonlyArray<{payload?: {fullName?: string}}>) =>
                        (payload?.[0]?.payload?.fullName ?? label) as string
                      }
                      contentStyle={barTooltipStyle}
                      cursor={{fill: 'rgba(99,102,241,0.06)'}}
                    />
                    <Bar dataKey="Views" radius={[5, 5, 0, 0]} maxBarSize={48}>
                      {productBarData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Searched Products */}
          <div style={{background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px'}}>
            <div style={{fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12}}>
              Top Searched Products
            </div>
            {topProductSearchesLoading ? (
              <SkeletonChart height={180} />
            ) : !topProductSearches?.topSearches?.length ? (
              <EmptyState label="No product search data yet." />
            ) : (
              <>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
                  <thead>
                    <tr>
                      <th style={{textAlign: 'left', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>#</th>
                      <th style={{textAlign: 'left', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>Search Term</th>
                      <th style={{textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #f1f5f9'}}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductSearches.topSearches.slice(0, productSearchVisible).map((row, i) => (
                      <tr key={row.term} style={{background: i % 2 === 0 ? '#f8fafc' : '#fff'}}>
                        <td style={{padding: '6px 8px', color: '#94a3b8', fontWeight: 700, fontSize: 11}}>{i + 1}</td>
                        <td style={{padding: '6px 8px', color: '#1e293b', fontWeight: 500}}>{row.term}</td>
                        <td style={{padding: '6px 8px', textAlign: 'right', color: '#10b981', fontWeight: 700}}>{fNum(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topProductSearches.topSearches.length > productSearchVisible && (
                  <div style={{textAlign: 'center', marginTop: 10}}>
                    <button
                      onClick={() => setProductSearchVisible((v) => v + 10)}
                      style={{
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '6px 18px',
                        fontSize: 12,
                        color: '#10b981',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Show {Math.min(10, topProductSearches.topSearches.length - productSearchVisible)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

