import React, {useState, useEffect, useMemo} from 'react'
import type {AnalyticsData, DateRange, EventData, EventParamRow} from '../ga-types'
import {fetchEventParams, fetchConditionValues, fetchEventsByCondition} from '../utils-ga-api'
import {sanityClient} from '../sanity-client-shim'
import {fNum, SECTION_INFO} from '../components/ga-constants'
import {Panel, DataTable, EmptyTab} from '../components/shared-ui'

export function EventsTab({
  data,
  loading,
  apiUrl,
  dateRange,
}: {
  data: AnalyticsData
  loading?: boolean
  apiUrl: string
  dateRange: DateRange
}) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [paramRows, setParamRows] = useState<EventParamRow[]>([])
  const [paramsLoading, setParamsLoading] = useState(false)
  const [paramsError, setParamsError] = useState<string | null>(null)

  const [conditionValues, setConditionValues] = useState<string[]>([])
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [filteredEvents, setFilteredEvents] = useState<EventData[] | null>(null)
  const [filterLoading, setFilterLoading] = useState(false)

  const [pharmacyNameMap, setPharmacyNameMap] = useState<Record<string, string>>({})

  useEffect(() => {
    sanityClient
      .fetch<{corporateId: number; name: string}[]>(`*[_type == "pharmacies"]{corporateId, name}`)
      .then((pharmacies) => {
        const map: Record<string, string> = {}
        for (const p of pharmacies) {
          if (p.corporateId != null) map[String(p.corporateId)] = p.name
        }
        setPharmacyNameMap(map)
      })
      .catch((err) => console.error('[EventsTab] fetchPharmacies error:', err))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchConditionValues(apiUrl, dateRange)
      .then((values) => {
        if (!cancelled) setConditionValues(values)
      })
      .catch((err) => console.error('[EventsTab] fetchConditionValues error:', err))
    return () => {
      cancelled = true
    }
  }, [apiUrl, dateRange])

  useEffect(() => {
    if (!selectedCondition) {
      setFilteredEvents(null)
      return
    }
    let cancelled = false
    setFilterLoading(true)
    fetchEventsByCondition(apiUrl, dateRange, selectedCondition)
      .then((rows) => {
        if (!cancelled) setFilteredEvents(rows)
      })
      .catch((err) => {
        console.error('[EventsTab] fetchEventsByCondition error:', err)
        if (!cancelled) setFilteredEvents([])
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCondition, apiUrl, dateRange])

  useEffect(() => {
    if (!selectedEvent) {
      setParamRows([])
      return
    }
    let cancelled = false
    setParamsLoading(true)
    setParamsError(null)
    fetchEventParams(apiUrl, selectedEvent, dateRange)
      .then((rows) => {
        if (!cancelled) setParamRows(rows)
      })
      .catch((err) => {
        console.error('[EventsTab] fetchEventParams error:', err)
        if (!cancelled) setParamsError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setParamsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedEvent, apiUrl, dateRange])

  const displayEvents = useMemo(
    () => filteredEvents ?? data.topEvents,
    [filteredEvents, data.topEvents],
  )

  if (!loading && data.topEvents.length === 0) return <EmptyTab />
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      {conditionValues.length > 0 && (
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <label
            htmlFor="ga-condition-filter"
            style={{fontSize: 12, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap'}}
          >
            Filter by branch:
          </label>
          <select
            id="ga-condition-filter"
            value={selectedCondition ?? ''}
            onChange={(e) => {
              setSelectedCondition(e.target.value || null)
              setSelectedEvent(null)
            }}
            style={{
              fontSize: 13,
              color: '#334155',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '5px 28px 5px 10px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              minWidth: 180,
            }}
          >
            <option value="">All Branches</option>
            {conditionValues.map((val) => (
              <option key={val} value={val}>
                {pharmacyNameMap[val] ?? val}
              </option>
            ))}
          </select>
          {selectedCondition && (
            <button
              onClick={() => {
                setSelectedCondition(null)
                setSelectedEvent(null)
              }}
              style={{
                fontSize: 11,
                color: '#64748b',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                lineHeight: 1,
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      <Panel title="Top Events" info={SECTION_INFO['Top Events']}>
        <DataTable
          loading={loading || filterLoading}
          headers={[
            {label: 'Event Name'},
            {label: 'Count', align: 'right', width: '80px'},
            {label: 'Users', align: 'right', width: '70px'},
          ]}
          rows={displayEvents.map((e) => [
            <span
              key={e.name}
              style={{
                cursor: 'pointer',
                color: selectedEvent === e.name ? '#4f8ef7' : '#334155',
                fontWeight: selectedEvent === e.name ? 600 : 400,
                borderBottom:
                  selectedEvent === e.name ? '1.5px solid #4f8ef7' : '1px dashed #cbd5e1',
                paddingBottom: 1,
                transition: 'all .15s',
              }}
            >
              {e.name}
            </span>,
            fNum(e.count),
            fNum(e.usersCount),
          ])}
        />
      </Panel>

      {selectedEvent && (
        <Panel
          title={`Parameters — ${selectedEvent}`}
          info="All custom event parameters recorded with this event — each row shows the parameter name, its value, and how many times that combination was recorded."
          style={{borderColor: '#4f8ef7', borderWidth: 1.5}}
        >
          {paramsError ? (
            <div style={{padding: 16, color: '#dc2626', fontSize: 13}}>{paramsError}</div>
          ) : (
            <DataTable
              loading={paramsLoading}
              headers={[
                {label: 'Parameter'},
                {label: 'Value'},
                {label: 'Count', align: 'right', width: '80px'},
              ]}
              rows={paramRows.map((r) => [r.paramKey, r.paramValue || '(NOT SET)', fNum(r.count)])}
              empty="No custom parameters recorded for this event"
              skeletonRows={4}
            />
          )}
        </Panel>
      )}
    </div>
  )
}
