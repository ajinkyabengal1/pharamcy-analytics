import React, {useState, useEffect, useMemo, useCallback} from 'react'
import type {SignupPatientRecord, FunnelEventsResponse} from '../utils-mixpanel-api'
import type {DateRange} from '../mixpanel-types'
import {fetchFunnelConditions, fetchFunnelEvents, fetchSignupPatients, clearMixpanelCache} from '../utils-mixpanel-api'
import {sanityClient} from '../sanity-client-shim'
import {MIXPANEL_API_URL, QFS_STEP_LABEL, formatFlowLabel} from './constants'
import type {FunnelRow, QfsFlowEntry} from './constants'
import {CustomSelect} from './custom-select'
import {PatientModal} from './patient-modal'
import {FunnelCard} from './funnel-card'

// High-field pharmacy has a single site — no branch_corporate_id concept.
// Conditions are fetched directly on mount (no branch filter needed).
export function FunnelEventsTab({dateRange}: {apiUrl: string; dateRange: string}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [clearing, setClearing] = useState(false)

  const [conditionOptions, setConditionOptions] = useState<{name: string; id: number | null}[]>([])
  const [selectedCondition, setSelectedCondition] = useState('')
  const [conditionsLoading, setConditionsLoading] = useState(true)

  const [rows, setRows] = useState<FunnelRow[]>([])
  const [qfsFlows, setQfsFlows] = useState<QfsFlowEntry[]>([])
  const [paramBreakdowns, setParamBreakdowns] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({})
  const [qfsStepBreakdowns, setQfsStepBreakdowns] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({})

  const [conditionServiceMap, setConditionServiceMap] = useState<Record<string, string>>({})

  // Patient modal state
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [patientRecords, setPatientRecords] = useState<SignupPatientRecord[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientsError, setPatientsError] = useState<string | null>(null)

  const doFetchPatients = useCallback(() => {
    if (!selectedCondition) return
    setPatientsLoading(true)
    setPatientsError(null)
    fetchSignupPatients(MIXPANEL_API_URL, dateRange as DateRange, selectedCondition)
      .then((records) => {
        setPatientRecords(records)
        setPatientsLoading(false)
      })
      .catch((err) => {
        console.error('[FunnelEventsTab] fetchSignupPatients error:', err)
        setPatientsError(err instanceof Error ? err.message : String(err))
        setPatientsLoading(false)
      })
  }, [dateRange, selectedCondition])

  const handleSignupCountClick = useCallback(() => {
    if (!selectedCondition) return
    setPatientModalOpen(true)
    doFetchPatients()
  }, [selectedCondition, doFetchPatients])

  // Re-fetch patient records when cache is cleared (refreshKey bump) and modal is open
  useEffect(() => {
    if (patientModalOpen && refreshKey > 0) {
      doFetchPatients()
    }
  }, [refreshKey])

  const exportPatientsCSV = useCallback(() => {
    if (!patientRecords.length) return
    const headers = [
      'Date', 'First Name', 'Last Name', 'Email', 'Phone',
      'Gender', 'DOB', 'Postcode', 'PDS Matched', 'Signup Status',
      'Journey Flow', 'Condition',
    ]
    const csvRows = [headers.join(',')]
    patientRecords.forEach((p) => {
      const date = p.timestamp ? new Date(p.timestamp * 1000).toLocaleDateString('en-GB') : ''
      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`
      csvRows.push([
        date, esc(p.first_name || ''), esc(p.last_name || ''),
        esc(p.email || ''), esc(p.phone || ''), p.gender || '',
        p.date_of_birth || '', p.postcode || '', p.pds_matched || '',
        p.signup_status || '', p.user_journey_flow || '', esc(p.condition_name || ''),
      ].join(','))
    })
    const blob = new Blob([csvRows.join('\n')], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signup-patients-${selectedCondition}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [patientRecords, selectedCondition])

  // ── Fetch all conditions directly on mount (no branch filter for single-site pharmacy) ──
  useEffect(() => {
    const controller = new AbortController()
    setConditionsLoading(true)
    setSelectedCondition('')
    fetchFunnelConditions(MIXPANEL_API_URL, dateRange as DateRange, undefined, true, controller.signal)
      .then((values) => {
        setConditionOptions(values)
        setConditionsLoading(false)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('[FunnelEventsTab] condition values error:', err)
        setConditionsLoading(false)
      })

    // Fetch condition service type (NHS / private) from Sanity — no corporateId filter needed
    sanityClient
      .fetch<{conditionId: number; services: string}[]>(
        `*[_type == "singleCondition"]{conditionId, services}`,
      )
      .then((docs) => {
        const map: Record<string, string> = {}
        for (const d of docs) {
          if (d.conditionId != null && d.services)
            map[String(d.conditionId)] = d.services?.toLowerCase() ?? ''
        }
        setConditionServiceMap(map)
      })
      .catch((err) => console.error('[FunnelEventsTab] fetchConditionServices error:', err))

    return () => controller.abort()
  }, [dateRange, refreshKey])

  // ── Fetch funnel events when condition is selected ──
  useEffect(() => {
    if (!selectedCondition) {
      setRows([])
      setQfsFlows([])
      setParamBreakdowns({})
      setQfsStepBreakdowns({})
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchFunnelEvents(MIXPANEL_API_URL, dateRange as DateRange, selectedCondition, undefined, controller.signal)
      .then((data: FunnelEventsResponse) => {
        const {eventCounts, qfsStepsByFlow, paramBreakdowns: bd, qfsStepBreakdowns: qfsStepBd} = data
        setParamBreakdowns(bd)
        setQfsStepBreakdowns(qfsStepBd ?? {})
        setRows([
          {event: 'condition_viewed', label: 'Condition Detail Page', count: eventCounts['condition_viewed'] ?? 0, isStep: false},
          {event: 'eligibility_checked', label: 'Check Eligibility Form', count: eventCounts['eligibility_checked'] ?? 0, isStep: false},
          {event: 'start_assessment_clicked', label: 'Assessment Started', count: eventCounts['start_assessment_clicked'] ?? 0, isStep: false},
        ])
        const flows: QfsFlowEntry[] = Object.entries(qfsStepsByFlow ?? {}).map(([flowKey, steps]) => ({
          flowKey,
          label: formatFlowLabel(flowKey),
          steps: steps.map((s) => ({step: s.step, label: QFS_STEP_LABEL[s.step] ?? s.step, count: s.count})),
        }))
        setQfsFlows(flows)
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('[FunnelEventsTab] fetch error:', err)
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => controller.abort()
  }, [dateRange, selectedCondition, refreshKey])

  const qfsTotal = useMemo(
    () => qfsFlows.reduce((sum, f) => sum + (f.steps[0]?.count ?? 0), 0),
    [qfsFlows],
  )

  const allRows: FunnelRow[] = useMemo(
    () => [
      ...rows.filter((r) => !r.isStep),
      {event: 'questionnaire_flow_step', label: 'Pre Consult Journey', count: qfsTotal, isStep: false},
    ],
    [rows, qfsTotal],
  )

  const conditionSelectOptions = useMemo(
    () =>
      conditionOptions.map((c) => {
        const svc = conditionServiceMap[String(c.id)]
        return {
          value: c.name,
          label: c.name,
          badge: svc === 'nhs' ? 'NHS' : svc === 'private' ? 'Private' : undefined,
          badgeColor: svc,
        }
      }),
    [conditionOptions, conditionServiceMap],
  )

  const handleClearFilters = useCallback(() => {
    setSelectedCondition('')
  }, [])

  const handleFetchLatest = useCallback(async () => {
    setClearing(true)
    try {
      await clearMixpanelCache(MIXPANEL_API_URL)
    } catch (err) {
      console.error('[FunnelEventsTab] clear-cache error:', err)
    } finally {
      setClearing(false)
      setRefreshKey((k) => k + 1)
    }
  }, [])

  const handleClosePatientModal = useCallback(() => setPatientModalOpen(false), [])

  return (
    <div style={{padding: '28px 0 48px', background: '#f8f9fb', minHeight: 500}}>
      {/* ── Filter bar ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e8eaed',
          padding: '20px 24px',
          marginBottom: 32,
          display: 'flex',
          gap: 20,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <CustomSelect
          label="Step 1 — Condition"
          value={selectedCondition}
          options={conditionSelectOptions}
          placeholder={conditionsLoading ? 'Loading conditions…' : 'Select a condition'}
          loading={conditionsLoading}
          onChange={setSelectedCondition}
        />
        {selectedCondition && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 500,
              color: '#666',
              background: '#f5f6f8',
              border: '1.5px solid #e2e6ea',
              borderRadius: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ Clear
          </button>
        )}
        <button
          onClick={handleFetchLatest}
          disabled={clearing || loading}
          style={{
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 600,
            color: clearing || loading ? '#93c5fd' : '#1d4ed8',
            background: clearing || loading ? '#eff6ff' : '#dbeafe',
            border: '1.5px solid #bfdbfe',
            borderRadius: 10,
            cursor: clearing || loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: clearing || loading ? 'spin 0.7s linear infinite' : 'none',
          }}>↻</span>
          {clearing ? 'Clearing…' : 'Fetch Latest'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#c53030',
            fontSize: 13,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{fontSize: 16}}>⚠️</span> {error}
        </div>
      )}

      {/* ── Empty state: no condition selected ── */}
      {!selectedCondition && !conditionsLoading && !loading && (
        <div style={{textAlign: 'center', padding: '72px 24px'}}>
          <div style={{fontSize: 44, marginBottom: 18, opacity: 0.4}}>🔍</div>
          <div style={{fontSize: 16, fontWeight: 600, color: '#444', marginBottom: 8}}>
            Select a condition to view funnel data
          </div>
          <div style={{fontSize: 13, color: '#aaa'}}>
            Pick a condition from the filter above to load the funnel breakdown.
          </div>
        </div>
      )}

      {/* ── Funnel cards ── */}
      {selectedCondition && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 0}}>
          {loading
            ? Array.from({length: 4}).map((_, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div style={{display: 'flex', justifyContent: 'center', padding: '6px 0'}}>
                      <div style={{width: 2, height: 28, background: '#e8eaed', borderRadius: 2}} />
                    </div>
                  )}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      border: '1.5px solid #e8eaed',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{width: 40, height: 40, borderRadius: 10, background: '#f0f0f0', flexShrink: 0}} />
                    <div style={{flex: 1}}>
                      <div style={{width: 180, height: 14, background: '#f0f0f0', borderRadius: 4, marginBottom: 8}} />
                      <div style={{width: 110, height: 11, background: '#f5f5f5', borderRadius: 4}} />
                    </div>
                    <div style={{width: 72, height: 48, background: '#f0f0f0', borderRadius: 10}} />
                  </div>
                </div>
              ))
            : allRows.map((r, i) => (
                <FunnelCard
                  key={r.event}
                  row={r}
                  index={i}
                  allRows={allRows}
                  paramBreakdowns={paramBreakdowns}
                  qfsStepBreakdowns={qfsStepBreakdowns}
                  qfsFlows={qfsFlows}
                  pharmacyNameMap={{}}
                  onSignupCountClick={handleSignupCountClick}
                />
              ))}
        </div>
      )}

      {/* ── Patient Modal ── */}
      <PatientModal
        open={patientModalOpen}
        onClose={handleClosePatientModal}
        loading={patientsLoading}
        error={patientsError}
        records={patientRecords}
        selectedCondition={selectedCondition}
        selectedBranch=""
        pharmacyNameMap={{}}
        onExport={exportPatientsCSV}
      />
    </div>
  )
}
