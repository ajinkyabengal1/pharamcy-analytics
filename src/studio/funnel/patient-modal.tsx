import React, {useMemo} from 'react'
import type {SignupPatientRecord} from '../utils-mixpanel-api'
import {fNum} from '../components/ga-constants'

interface PatientModalProps {
  open: boolean
  onClose: () => void
  loading: boolean
  error: string | null
  records: SignupPatientRecord[]
  selectedCondition: string
  selectedBranch: string
  pharmacyNameMap: Record<string, string>
  onExport: () => void
}

export const PatientModal = React.memo(function PatientModal({
  open,
  onClose,
  loading,
  error,
  records,
  selectedCondition,
  selectedBranch,
  pharmacyNameMap,
  onExport,
}: PatientModalProps) {
  const formattedRecords = useMemo(
    () =>
      records.map((p) => ({
        ...p,
        _date: p.timestamp
          ? new Date(p.timestamp * 1000).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
        _name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '—',
      })),
    [records],
  )

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '92vw',
          maxWidth: 1100,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #e8eaed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
          }}
        >
          <div>
            <h3 style={{margin: 0, fontSize: 17, fontWeight: 700, color: '#111'}}>
              👤 Sign Up Patient Records
            </h3>
            <p style={{margin: '4px 0 0', fontSize: 12, color: '#888'}}>
              {selectedCondition}
              {selectedBranch
                ? ` · Branch ${pharmacyNameMap[selectedBranch] || selectedBranch}`
                : ''}
              {!loading &&
                ` · ${records.length} record${records.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {records.length > 0 && (
              <button
                onClick={onExport}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#059669'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#10b981'
                }}
              >
                📥 Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e2e6ea',
                background: '#f8f9fb',
                cursor: 'pointer',
                fontSize: 16,
                color: '#888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = '#f8f9fb'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#888'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{flex: 1, overflowY: 'auto', padding: 0}}>
          {loading ? (
            <div style={{padding: 60, textAlign: 'center'}}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#4f46e5',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'patientSpin 0.7s linear infinite',
                }}
              />
              <style>{`@keyframes patientSpin { to { transform: rotate(360deg) } }`}</style>
              <p style={{fontSize: 13, color: '#888'}}>Loading patient records…</p>
            </div>
          ) : error ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#ef4444'}}>⚠️ {error}</p>
            </div>
          ) : records.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#888'}}>
                No patient records found for this period.
              </p>
            </div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 12}}>
              <thead>
                <tr style={{background: '#f8f9fb', position: 'sticky', top: 0, zIndex: 1}}>
                  {[
                    'Date',
                    'Name',
                    'Email',
                    'Phone',
                    'Gender',
                    'DOB',
                    'Postcode',
                    'PDS',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: '#666',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '2px solid #e8eaed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formattedRecords.map((p, pi) => {
                  return (
                    <tr
                      key={`${p.distinct_id}-${pi}`}
                      style={{borderBottom: '1px solid #f2f4f7'}}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLTableRowElement).style.background = '#f8f9ff'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                      }}
                    >
                      <td style={{padding: '10px 14px', color: '#888', whiteSpace: 'nowrap'}}>
                        {p._date}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: '#222',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p._name}
                      </td>
                      <td style={{padding: '10px 14px'}}>
                        {p.email ? (
                          <a
                            href={`mailto:${p.email}`}
                            style={{color: '#4f46e5', textDecoration: 'none', fontWeight: 500}}
                            onMouseEnter={(e) => {
                              ;(e.currentTarget as HTMLAnchorElement).style.textDecoration =
                                'underline'
                            }}
                            onMouseLeave={(e) => {
                              ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'
                            }}
                          >
                            {p.email}
                          </a>
                        ) : (
                          <span style={{color: '#ccc'}}>—</span>
                        )}
                      </td>
                      <td style={{padding: '10px 14px', color: '#444'}}>
                        {p.phone || <span style={{color: '#ccc'}}>—</span>}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: '#444',
                          textTransform: 'capitalize',
                        }}
                      >
                        {p.gender || <span style={{color: '#ccc'}}>—</span>}
                      </td>
                      <td style={{padding: '10px 14px', color: '#444', whiteSpace: 'nowrap'}}>
                        {p.date_of_birth || <span style={{color: '#ccc'}}>—</span>}
                      </td>
                      <td style={{padding: '10px 14px', color: '#444'}}>
                        {p.postcode || <span style={{color: '#ccc'}}>—</span>}
                      </td>
                      <td style={{padding: '10px 14px'}}>
                        {p.pds_matched === 'true' ? (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#16a34a',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            ✓ Matched
                          </span>
                        ) : p.pds_matched === 'false' ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            ✗ No Match
                          </span>
                        ) : (
                          <span style={{color: '#ccc'}}>—</span>
                        )}
                      </td>
                      <td style={{padding: '10px 14px'}}>
                        {p.signup_status === 'success' ? (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#16a34a',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            Success
                          </span>
                        ) : p.signup_status === 'failed' ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            Failed
                          </span>
                        ) : p.signup_status ? (
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {p.signup_status}
                          </span>
                        ) : (
                          <span style={{color: '#ccc'}}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
})
