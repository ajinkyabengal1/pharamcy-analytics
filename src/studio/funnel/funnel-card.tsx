import React, {useMemo} from 'react'
import {fNum} from '../components/ga-constants'
import {FUNNEL_EVENT_COLOR, FUNNEL_EVENT_ICON, FUNNEL_EVENT_DESC} from './constants'
import type {FunnelRow, QfsFlowEntry} from './constants'
import {QfsJourneyFlows, ParamBreakdown} from './card-sections'

export interface FunnelCardProps {
  row: FunnelRow
  index: number
  allRows: FunnelRow[]
  paramBreakdowns: Record<string, Record<string, Record<string, number>>>
  qfsStepBreakdowns: Record<string, Record<string, Record<string, number>>>
  qfsFlows: QfsFlowEntry[]
  pharmacyNameMap: Record<string, string>
  onSignupCountClick: () => void
}

export function FunnelCard({
  row: r,
  index: i,
  allRows,
  paramBreakdowns,
  qfsStepBreakdowns,
  qfsFlows,
  pharmacyNameMap,
  onSignupCountClick,
}: FunnelCardProps) {
  const color = FUNNEL_EVENT_COLOR[r.event] ?? '#888'
  const isQfs = r.event === 'questionnaire_flow_step'

  const breakdown = useMemo(
    () => (!isQfs && r.event !== 'condition_viewed' ? paramBreakdowns[r.event] : undefined),
    [isQfs, paramBreakdowns, r.event],
  )

  const filteredBreakdownEntries = useMemo(
    () =>
      breakdown
        ? Object.entries(breakdown).filter(
            ([pk]) =>
              pk !== 'condition_slug' &&
              pk !== 'date_of_birth' &&
              pk !== 'is_pre_consult' &&
              !(r.event === 'start_assessment_clicked' && pk === 'is_nhs'),
          )
        : [],
    [breakdown, r.event],
  )

  const hasBreakdown = filteredBreakdownEntries.length > 0

  const visibleFlows = useMemo(
    () => (isQfs ? qfsFlows.filter((f) => f.steps.some((s) => s.count > 0)) : []),
    [isQfs, qfsFlows],
  )

  const firstCount = allRows[0]?.count ?? 0
  const convPct = i > 0 && firstCount > 0 ? Math.round((r.count / firstCount) * 100) : 100
  const prevCount = i > 0 ? allRows[i - 1]!.count : null
  const dropCount = prevCount != null ? prevCount - r.count : null

  return (
    <div>
      {/* ── Connector ── */}
      {i > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '4px 0',
            gap: 0,
          }}
        >
          <div
            style={{
              width: 2,
              height: 14,
              background: 'linear-gradient(to bottom, #cbd5e1, #e2e8f0)',
              borderRadius: 2,
            }}
          />
          {dropCount != null && dropCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff8f0',
                border: '1px solid #fed7aa',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: '#c2410c',
              }}
            >
              <span style={{fontSize: 13}}>↓</span>
              <span>−{fNum(dropCount)} dropped off</span>
            </div>
          )}
          <div
            style={{
              width: 2,
              height: 14,
              background: 'linear-gradient(to bottom, #e2e8f0, #cbd5e1)',
              borderRadius: 2,
            }}
          />
        </div>
      )}

      {/* ── Card ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #e8eaed',
          borderLeft: `5px solid ${color}`,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Card header */}
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '22px 24px'}}>
          <div style={{flexShrink: 0}}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${color}20 0%, ${color}0c 100%)`,
                border: `1.5px solid ${color}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              {FUNNEL_EVENT_ICON[r.event] ?? '📊'}
            </div>
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#111',
                marginBottom: 5,
                lineHeight: 1.2,
              }}
            >
              {r.label}
            </div>
            <div style={{fontSize: 12, color: '#888', marginBottom: 8}}>
              {FUNNEL_EVENT_DESC[r.event]}
            </div>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6}}>
              {i > 0 && firstCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      convPct >= 60 ? '#16a34a' : convPct >= 30 ? '#d97706' : '#dc2626',
                    background:
                      convPct >= 60 ? '#f0fdf4' : convPct >= 30 ? '#fffbeb' : '#fef2f2',
                    border: `1px solid ${convPct >= 60 ? '#bbf7d0' : convPct >= 30 ? '#fde68a' : '#fecaca'}`,
                    borderRadius: 6,
                    padding: '2px 8px',
                  }}
                >
                  {convPct}% of total
                </span>
              )}
            </div>
          </div>
          {/* Count box */}
          <div style={{flexShrink: 0, textAlign: 'center', minWidth: 100}}>
            <div
              style={{
                background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
                border: `1.5px solid ${color}30`,
                borderRadius: 14,
                padding: '12px 20px',
                marginBottom: 8,
              }}
            >
              <div style={{fontSize: 28, fontWeight: 800, color, lineHeight: 1}}>
                {r.count > 0 ? fNum(r.count) : '—'}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#999',
                  marginTop: 5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  fontWeight: 600,
                }}
              >
                users
              </div>
            </div>
            <div
              style={{height: 5, borderRadius: 3, background: '#f0f2f5', overflow: 'hidden'}}
            >
              <div
                style={{
                  height: '100%',
                  width: `${convPct}%`,
                  background: `linear-gradient(to right, ${color}99, ${color})`,
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{fontSize: 10, color: '#bbb', marginTop: 3}}>{convPct}% of step 1</div>
          </div>
        </div>

        {/* ── QFS journey flows ── */}
        {isQfs && visibleFlows.length > 0 && (
          <QfsJourneyFlows
            color={color}
            flows={visibleFlows}
            qfsStepBreakdowns={qfsStepBreakdowns}
            onSignupCountClick={onSignupCountClick}
          />
        )}

        {/* ── Param breakdowns ── */}
        {hasBreakdown && (
          <ParamBreakdown
            color={color}
            event={r.event}
            breakdown={breakdown!}
            pharmacyNameMap={pharmacyNameMap}
          />
        )}
      </div>
    </div>
  )
}
