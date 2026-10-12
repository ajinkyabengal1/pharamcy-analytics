import React, {useState, useEffect, useMemo} from 'react'
import type {DateRange, EventParamRow} from '../ga-types'
import {fetchEventParams} from '../utils-ga-api'
import {CUSTOM_EVENT_GROUPS, fNum} from '../components/ga-constants'

const ALL_EVENTS = CUSTOM_EVENT_GROUPS.flatMap((g) => g.events)

const PIVOT_PARAM_OPTIONS: {key: string; label: string}[] = [
  {key: 'condition_name', label: 'Condition Name'},
  {key: 'branch_corporate_id', label: 'Branch'},
  {key: 'eligibility_status', label: 'Eligibility Status'},
  {key: 'status', label: 'Status'},
  {key: 'previous_status', label: 'Previous Status'},
  {key: 'step', label: 'Flow Step'},
  {key: 'last_step', label: 'Drop-off Step'},
  {key: 'source', label: 'Source'},
  {key: 'assignment_type', label: 'Assignment Type'},
  {key: 'gender', label: 'Gender'},
  {key: 'is_nhs', label: 'NHS'},
  {key: 'pds_matched', label: 'PDS Matched'},
  {key: 'action', label: 'Cart Action'},
  {key: 'enabled', label: 'Toggle State'},
  {key: 'payment_method', label: 'Payment Method'},
  {key: 'delivery_option', label: 'Delivery Option'},
  {key: 'view', label: 'Auth View'},
]

export function EventPivotTable({
  apiUrl,
  dateRange,
  pharmacyNameMap,
}: {
  apiUrl: string
  dateRange: DateRange
  pharmacyNameMap: Record<string, string>
}) {
  const [pivotKey, setPivotKey] = useState('condition_name')
  const [eventData, setEventData] = useState<Record<string, EventParamRow[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all(
      ALL_EVENTS.map((evt) =>
        fetchEventParams(apiUrl, evt, dateRange)
          .then((rows) => ({evt, rows}))
          .catch(() => ({evt, rows: [] as EventParamRow[]})),
      ),
    )
      .then((results) => {
        const map: Record<string, EventParamRow[]> = {}
        for (const {evt, rows} of results) map[evt] = rows
        setEventData(map)
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [apiUrl, dateRange])

  const columnValues = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const rows of Object.values(eventData)) {
      for (const row of rows) {
        if (row.paramKey === pivotKey && row.paramValue !== '') {
          totals[row.paramValue] = (totals[row.paramValue] ?? 0) + row.count
        }
      }
    }
    return Object.keys(totals).sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0))
  }, [eventData, pivotKey])

  const visibleEvents = useMemo(
    () =>
      ALL_EVENTS.filter((evt) =>
        (eventData[evt] ?? []).some(
          (r) => r.paramKey === pivotKey && r.paramValue !== '' && r.count > 0,
        ),
      ),
    [eventData, pivotKey],
  )

  // Pre-compute a lookup table: cellData[event][colValue] = count
  const {cellData, rowTotals, colTotals, grandTotal} = useMemo(() => {
    const cells: Record<string, Record<string, number>> = {}
    const rTotals: Record<string, number> = {}
    const cTotals: Record<string, number> = {}
    let gTotal = 0

    for (const evt of visibleEvents) {
      cells[evt] = {}
      let rowSum = 0
      for (const row of eventData[evt] ?? []) {
        if (row.paramKey === pivotKey && row.paramValue !== '') {
          cells[evt]![row.paramValue] = (cells[evt]![row.paramValue] ?? 0) + row.count
          rowSum += row.count
        }
      }
      rTotals[evt] = rowSum
      gTotal += rowSum
    }

    for (const col of columnValues) {
      let colSum = 0
      for (const evt of visibleEvents) {
        colSum += cells[evt]?.[col] ?? 0
      }
      cTotals[col] = colSum
    }

    return {cellData: cells, rowTotals: rTotals, colTotals: cTotals, grandTotal: gTotal}
  }, [eventData, pivotKey, visibleEvents, columnValues])

  const getCount = (evt: string, col: string) => cellData[evt]?.[col] ?? 0
  const getRowTotal = (evt: string) => rowTotals[evt] ?? 0
  const getColTotal = (col: string) => colTotals[col] ?? 0

  const displayCol = (val: string) =>
    pivotKey === 'branch_corporate_id' ? (pharmacyNameMap[val] ?? `Branch ${val}`) : val

  if (error) return <div style={{padding: 16, color: '#dc2626', fontSize: 13}}>{error}</div>

  if (loading)
    return (
      <div style={{padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
        Loading matrix…
      </div>
    )

  const thBase: React.CSSProperties = {
    padding: '8px 12px',
    fontWeight: 600,
    color: '#475569',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
    background: '#f8fafc',
  }
  const colTh: React.CSSProperties = {
    ...thBase,
    textAlign: 'right',
    minWidth: 110,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{fontSize: 12, color: '#64748b', fontWeight: 600}}>Column dimension:</span>
        <select
          value={pivotKey}
          onChange={(e) => setPivotKey(e.target.value)}
          style={{
            fontSize: 12,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#1e293b',
            cursor: 'pointer',
          }}
        >
          {PIVOT_PARAM_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {visibleEvents.length === 0 ? (
        <div style={{padding: '32px 0', textAlign: 'center', color: '#cbd5e1', fontSize: 13}}>
          No data for selected dimension
        </div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 12}}>
            <thead>
              <tr>
                <th
                  style={{...thBase, textAlign: 'left', position: 'sticky', left: 0, minWidth: 210}}
                >
                  Event Name
                </th>
                {columnValues.map((col) => (
                  <th key={col} style={colTh} title={displayCol(col)}>
                    {displayCol(col)}
                  </th>
                ))}
                <th
                  style={{
                    ...thBase,
                    textAlign: 'right',
                    background: '#eef2fa',
                    minWidth: 80,
                    color: '#1e293b',
                  }}
                >
                  Totals
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Grand-total row */}
              <tr style={{background: '#f1f5f9'}}>
                <td
                  style={{
                    padding: '6px 12px',
                    fontWeight: 700,
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    left: 0,
                    background: '#f1f5f9',
                  }}
                >
                  Totals
                </td>
                {columnValues.map((col) => {
                  const t = getColTotal(col)
                  const pct = grandTotal > 0 ? Math.round((t / grandTotal) * 1000) / 10 : 0
                  return (
                    <td
                      key={col}
                      style={{
                        padding: '6px 12px',
                        textAlign: 'right',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: 700,
                        color: '#1e293b',
                      }}
                    >
                      <div>{fNum(t)}</div>
                      <div style={{fontSize: 10, color: '#94a3b8', fontWeight: 400}}>
                        {pct}% of total
                      </div>
                    </td>
                  )
                })}
                <td
                  style={{
                    padding: '6px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: '#1e293b',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#dde5f5',
                  }}
                >
                  {fNum(grandTotal)}
                </td>
              </tr>

              {/* Event rows */}
              {visibleEvents.map((evt, ri) => {
                const rowTotal = getRowTotal(evt)
                const maxInRow = columnValues.reduce((m, col) => Math.max(m, getCount(evt, col)), 0)
                const rowBg = ri % 2 === 0 ? '#fff' : '#fafbfc'
                return (
                  <tr key={evt} style={{background: rowBg}}>
                    <td
                      style={{
                        padding: '7px 12px',
                        fontWeight: 500,
                        color: '#334155',
                        borderBottom: '1px solid #f1f5f9',
                        position: 'sticky',
                        left: 0,
                        background: rowBg,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {evt}
                    </td>
                    {columnValues.map((col) => {
                      const count = getCount(evt, col)
                      const barPct = maxInRow > 0 ? Math.round((count / maxInRow) * 100) : 0
                      return (
                        <td
                          key={col}
                          style={{
                            padding: '7px 12px',
                            textAlign: 'right',
                            borderBottom: '1px solid #f1f5f9',
                            position: 'relative',
                            color: count > 0 ? '#1e293b' : '#cbd5e1',
                            fontWeight: count > 0 ? 600 : 400,
                          }}
                        >
                          {count > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                height: 3,
                                width: `${barPct}%`,
                                background: '#4f8ef7',
                                opacity: 0.35,
                                borderRadius: 2,
                              }}
                            />
                          )}
                          {count > 0 ? fNum(count) : '—'}
                        </td>
                      )
                    })}
                    <td
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1e293b',
                        borderBottom: '1px solid #f1f5f9',
                        background: ri % 2 === 0 ? '#f8fafc' : '#f1f5f9',
                      }}
                    >
                      {fNum(rowTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
