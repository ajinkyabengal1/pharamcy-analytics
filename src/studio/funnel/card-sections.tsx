import React from 'react'
import {fNum} from '../components/ga-constants'
import {fVal, getValueBarColor} from './constants'
import type {QfsFlowEntry} from './constants'

/* ─── QFS Journey Flows sub-section ─── */
export function QfsJourneyFlows({
  color,
  flows,
  qfsStepBreakdowns,
  onSignupCountClick,
}: {
  color: string
  flows: QfsFlowEntry[]
  qfsStepBreakdowns: Record<string, Record<string, Record<string, number>>>
  onSignupCountClick: () => void
}) {
  return (
    <div
      style={{
        borderTop: `1.5px solid ${color}20`,
        background: `linear-gradient(135deg, ${color}06 0%, #fafbfc 100%)`,
        padding: '20px 24px 24px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 2,
            background: color,
            borderRadius: 1,
            display: 'inline-block',
          }}
        />
        Journey Flows
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
        {flows.map((flow) => (
          <div
            key={flow.flowKey}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: `1.5px solid ${color}30`,
              overflow: 'hidden',
              minWidth: 220,
              flex: '1 1 220px',
              maxWidth: 360,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                background: `${color}14`,
                borderBottom: `1px solid ${color}22`,
                padding: '11px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{fontSize: 12, fontWeight: 700, color: '#222'}}>{flow.label}</span>
            </div>
            {flow.steps.map((s, si) => {
              const isSignUp = s.step === 'sign_up_form_submission'
              const isQSubmitted = s.step === 'questionnaire_submitted'
              const stepBd = isSignUp
                ? qfsStepBreakdowns['sign_up_form_submission']
                : isQSubmitted
                  ? qfsStepBreakdowns['questionnaire_submitted']
                  : undefined
              const newContactBd = isSignUp ? stepBd?.['newContactSelected'] : undefined
              const pdsBd = isSignUp ? stepBd?.['pds_matched'] : undefined
              const gatewayBd = isQSubmitted ? stepBd?.['is_gateway_point'] : undefined
              return (
                <div
                  key={s.step}
                  style={{
                    padding: '11px 16px',
                    borderBottom: si < flow.steps.length - 1 ? '1px solid #f2f4f7' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: 10, minWidth: 0}}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: `${color}18`,
                          color,
                          fontSize: 10,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {si + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#444',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {isSignUp ? (
                      <span
                        onClick={onSignupCountClick}
                        title="View patient details"
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#4f46e5',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationStyle: 'dotted' as const,
                          textUnderlineOffset: 3,
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLSpanElement).style.color = '#3730a3'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLSpanElement).style.color = '#4f46e5'
                        }}
                      >
                        {fNum(s.count)} 👤
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#1a1a1a',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fNum(s.count)}
                      </span>
                    )}
                  </div>
                  {(isSignUp && (newContactBd || pdsBd) || isQSubmitted && gatewayBd) && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 9,
                        paddingLeft: 30,
                      }}
                    >
                      {newContactBd &&
                        (() => {
                          const newC = newContactBd['true'] ?? 0
                          const oldC = newContactBd['false'] ?? 0
                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0,
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                              }}
                            >
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  fontWeight: 600,
                                }}
                              >
                                New <span style={{fontWeight: 800}}>{fNum(newC)}</span>
                              </div>
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  fontWeight: 600,
                                }}
                              >
                                Existing <span style={{fontWeight: 800}}>{fNum(oldC)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      {pdsBd &&
                        (() => {
                          const matched = pdsBd['true'] ?? 0
                          const unmatched = pdsBd['false'] ?? 0
                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0,
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                              }}
                            >
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#f0fdf4',
                                  color: '#16a34a',
                                  fontWeight: 600,
                                }}
                              >
                                ✓ PDS <span style={{fontWeight: 800}}>{fNum(matched)}</span>
                              </div>
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  fontWeight: 600,
                                }}
                              >
                                No PDS <span style={{fontWeight: 800}}>{fNum(unmatched)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      {gatewayBd &&
                        (() => {
                          const reached = gatewayBd['true'] ?? 0
                          const notReached = gatewayBd['false'] ?? 0
                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0,
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                fontSize: 11,
                              }}
                            >
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#fdf4ff',
                                  color: '#7e22ce',
                                  fontWeight: 600,
                                }}
                              >
                                🚪 Gateway <span style={{fontWeight: 800}}>{fNum(reached)}</span>
                              </div>
                              <div
                                style={{
                                  padding: '6px 10px',
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  fontWeight: 600,
                                }}
                              >
                                Not Gateway <span style={{fontWeight: 800}}>{fNum(notReached)}</span>
                              </div>
                            </div>
                          )
                        })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Param Breakdown sub-section ─── */
export function ParamBreakdown({
  color,
  event,
  breakdown,
  pharmacyNameMap,
}: {
  color: string
  event: string
  breakdown: Record<string, Record<string, number>>
  pharmacyNameMap: Record<string, string>
}) {
  return (
    <div
      style={{
        borderTop: `1.5px solid ${color}15`,
        background: '#fafbfc',
        padding: '20px 24px 24px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#aaa',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 2,
            background: '#cbd5e1',
            borderRadius: 1,
            display: 'inline-block',
          }}
        />
        Breakdown
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14}}>
        {Object.entries(breakdown)
          .filter(
            ([pk]) =>
              pk !== 'condition_slug' &&
              pk !== 'date_of_birth' &&
              !(event === 'start_assessment_clicked' && pk === 'is_nhs'),
          )
          .map(([pk, valueCounts]) => {
            const entries = Object.entries(valueCounts)
              .map(([v, c]) => ({value: v, count: c}))
              .sort((a, b) => b.count - a.count)
            const total = entries.reduce((s, e) => s + e.count, 0)
            return (
              <div
                key={pk}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1.5px solid #e8eaed',
                  overflow: 'hidden',
                  minWidth: 190,
                  flex: '1 1 190px',
                  maxWidth: 310,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    background: `${color}10`,
                    borderBottom: `1px solid ${color}20`,
                    padding: '9px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.7px',
                    }}
                  >
                    {pk.replace(/_/g, ' ')}
                  </div>
                </div>
                {entries.map((v, vi) => {
                  const pct = total > 0 ? Math.round((v.count / total) * 100) : 0
                  const barColor = getValueBarColor(pk, v.value, color)
                  return (
                    <div
                      key={v.value}
                      style={{
                        padding: '10px 14px',
                        borderBottom: vi < entries.length - 1 ? '1px solid #f2f4f7' : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 6,
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: '#444',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {pk === 'branch_corporate_id'
                            ? pharmacyNameMap[v.value] ?? `Branch ${v.value}`
                            : fVal(pk, v.value)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#111',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fNum(v.count)}
                        </span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: '#f0f2f5',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: barColor,
                            }}
                          />
                        </div>
                        <span
                          style={{fontSize: 10, color: '#bbb', minWidth: 28, textAlign: 'right'}}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
      </div>
    </div>
  )
}
