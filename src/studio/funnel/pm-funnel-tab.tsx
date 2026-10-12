import React, {useState, useEffect, useCallback} from 'react'
import type {DateRange} from '../mixpanel-types'
import type {PmFunnelEventsResponse, PmConditionEventsResponse, PmProductCartResponse, CartAuthPatientRecord} from '../utils-mixpanel-api'
import {fetchPmFunnelProducts, fetchPmFunnelEvents, fetchPmConditionOptions, fetchPmConditionEvents, fetchPmProductCart, fetchCartAuthPatients, fetchAuthPatients, clearMixpanelCache} from '../utils-mixpanel-api'
import {sanityClient} from '../sanity-client-shim'
import {fNum} from '../components/ga-constants'
import {
  MIXPANEL_API_URL,
  PM_PRODUCT_DETAIL_EVENTS,
  PM_FUNNEL_EVENT_COLOR,
  PM_FUNNEL_EVENT_ICON,
  PM_FUNNEL_EVENT_LABEL,
  getValueBarColor,
  fVal,
} from './constants'
import {CustomSelect} from './custom-select'

type FlowSource = 'product_detail' | 'condition_detail'

// ── Param breakdown sub-section ──────────────────────────────────────────

const HIDDEN_PARAMS = new Set([
  'product_name',
  'product_id',
  'product_slug',
  'core_drug_id',
  'condition_id',
  'condition_name',
  'pm_flow_source',
  'user_dob',
  'user_email',
  'user_name',
  'user_phone',
  'cart_total_price',
  'cart_item_count',
  'cart_auth_status',
])

function PmParamBreakdown({
  color,
  breakdown,
}: {
  color: string
  breakdown: Record<string, Record<string, number>>
}) {
  const entries = Object.entries(breakdown).filter(([k]) => !HIDDEN_PARAMS.has(k))
  if (entries.length === 0) return null

  return (
    <div style={{borderTop: `1.5px solid ${color}15`, background: '#fafbfc', padding: '20px 24px 24px'}}>
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
        <span style={{width: 16, height: 2, background: '#cbd5e1', borderRadius: 1, display: 'inline-block'}} />
        Breakdown
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14}}>
        {entries.map(([pk, valueCounts]) => {
          const sorted = Object.entries(valueCounts)
            .map(([v, c]) => ({value: v, count: c}))
            .sort((a, b) => b.count - a.count)
          const total = sorted.reduce((s, e) => s + e.count, 0)
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
              <div style={{background: `${color}10`, borderBottom: `1px solid ${color}20`, padding: '9px 14px'}}>
                <div style={{fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.7px'}}>
                  {pk.replace(/_/g, ' ')}
                </div>
              </div>
              {sorted.map((v, vi) => {
                const pct = total > 0 ? Math.round((v.count / total) * 100) : 0
                const barColor = getValueBarColor(pk, v.value, color)
                return (
                  <div
                    key={v.value}
                    style={{padding: '10px 14px', borderBottom: vi < sorted.length - 1 ? '1px solid #f2f4f7' : 'none'}}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8}}>
                      <span style={{fontSize: 12, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1}}>
                        {fVal(pk, v.value)}
                      </span>
                      <span style={{fontSize: 12, fontWeight: 700, color: '#111', whiteSpace: 'nowrap'}}>{fNum(v.count)}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <div style={{flex: 1, height: 4, borderRadius: 2, background: '#f0f2f5', overflow: 'hidden'}}>
                        <div style={{height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s'}} />
                      </div>
                      <span style={{fontSize: 10, color: '#bbb', minWidth: 28, textAlign: 'right'}}>{pct}%</span>
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

// ── Flowchart primitives ──────────────────────────────────────────────────

const CON_COLOR = '#94a3b8'

function FlowNode({icon, label, sublabel, count, firstCount, color, onClick}: {
  icon: string; label: string; sublabel?: string; count: number; firstCount: number; color: string; onClick?: () => void
}) {
  const pct = firstCount > 0 ? Math.round((count / firstCount) * 100) : 100
  return (
    <div style={{background: '#fff', borderRadius: 14, border: `2px solid ${color}44`, boxShadow: `0 2px 10px ${color}1a`, overflow: 'hidden'}}>
      <div style={{background: `linear-gradient(135deg, ${color}1c, ${color}08)`, borderBottom: `1.5px solid ${color}25`, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{fontSize: 20}}>{icon}</span>
        <div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#111'}}>{label}</div>
          {sublabel && <div style={{fontSize: 10, color: '#aaa', marginTop: 1, fontFamily: 'monospace'}}>{sublabel}</div>}
        </div>
      </div>
      <div style={{padding: '12px 16px'}}>
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
          <div>
            <div style={{fontSize: 26, fontWeight: 800, color, lineHeight: 1}}>{count > 0 ? fNum(count) : '—'}</div>
            <div style={{fontSize: 9, color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3}}>events</div>
          </div>
          {onClick && count > 0 && (
            <button
              onClick={onClick}
              style={{fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14}}
            >
              👤 View
            </button>
          )}
        </div>
        <div style={{marginTop: 8, height: 4, borderRadius: 2, background: '#f0f2f5', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${pct}%`, background: `linear-gradient(to right, ${color}60, ${color})`, borderRadius: 2, transition: 'width 0.5s ease'}} />
        </div>
        <div style={{fontSize: 10, color: '#bbb', marginTop: 3}}>{pct}% of total</div>
      </div>
    </div>
  )
}

function DropConn({from, to}: {from: number; to: number}) {
  const drop = from - to
  const pct = from > 0 ? Math.round((to / from) * 100) : 0
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0'}}>
      <div style={{width: 2, height: 14, background: CON_COLOR, borderRadius: 1}} />
      {drop > 0 && (
        <div style={{fontSize: 10, fontWeight: 600, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: '3px 12px', margin: '3px 0'}}>
          ↓ {fNum(drop)} dropped · {pct}% continued
        </div>
      )}
      <div style={{width: 2, height: 14, background: CON_COLOR, borderRadius: 1}} />
    </div>
  )
}

function SplitLine({leftColor, rightColor}: {leftColor: string; rightColor: string}) {
  return (
    <svg width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none" style={{display: 'block'}}>
      <line x1="100" y1="0" x2="100" y2="16" stroke={CON_COLOR} strokeWidth="2" />
      <path d="M 100 16 C 100 44, 50 44, 50 52" fill="none" stroke={leftColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 100 16 C 100 44, 150 44, 150 52" fill="none" stroke={rightColor} strokeWidth="2.5" strokeOpacity="0.75" />
    </svg>
  )
}

function ThreeSplitLine({leftColor, centerColor, rightColor}: {leftColor: string; centerColor: string; rightColor: string}) {
  return (
    <svg width="100%" height="52" viewBox="0 0 300 52" preserveAspectRatio="none" style={{display: 'block'}}>
      <line x1="150" y1="0" x2="150" y2="16" stroke={CON_COLOR} strokeWidth="2" />
      <path d="M 150 16 C 150 44, 50 44, 50 52" fill="none" stroke={leftColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 150 16 C 150 44, 150 44, 150 52" fill="none" stroke={centerColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 150 16 C 150 44, 250 44, 250 52" fill="none" stroke={rightColor} strokeWidth="2.5" strokeOpacity="0.75" />
    </svg>
  )
}

function MergeLine({leftColor, rightColor}: {leftColor: string; rightColor: string}) {
  return (
    <svg width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none" style={{display: 'block'}}>
      <path d="M 50 0 C 50 8, 100 8, 100 36" fill="none" stroke={leftColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 150 0 C 150 8, 100 8, 100 36" fill="none" stroke={rightColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <line x1="100" y1="36" x2="100" y2="52" stroke={CON_COLOR} strokeWidth="2" />
    </svg>
  )
}

function ThreeMergeLine({leftColor, centerColor, rightColor}: {leftColor: string; centerColor: string; rightColor: string}) {
  return (
    <svg width="100%" height="52" viewBox="0 0 300 52" preserveAspectRatio="none" style={{display: 'block'}}>
      <path d="M 50 0 C 50 8, 150 8, 150 36" fill="none" stroke={leftColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 150 0 C 150 8, 150 8, 150 36" fill="none" stroke={centerColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <path d="M 250 0 C 250 8, 150 8, 150 36" fill="none" stroke={rightColor} strokeWidth="2.5" strokeOpacity="0.75" />
      <line x1="150" y1="36" x2="150" y2="52" stroke={CON_COLOR} strokeWidth="2" />
    </svg>
  )
}

// ── Product Detail flowchart (unchanged) ─────────────────────────────────

function ProductDetailFlowchart({eventsData, onCartAuthClick, onAuthClick}: {eventsData: PmFunnelEventsResponse; onCartAuthClick?: () => void; onAuthClick?: () => void}) {
  const ec = eventsData.eventCounts
  const authMethods = (eventsData.paramBreakdowns?.auth_completed?.method ?? {}) as Record<string, number>
  const signedInCount = ['signup', 'Signup', 'sign_in', 'Sign In', 'signin', 'Signin', 'Sign_In'].reduce(
    (acc, k) => acc + (authMethods[k] ?? 0), 0,
  )
  const guestCount = (authMethods['guest'] ?? 0) + (authMethods['Guest'] ?? 0)
  const alreadyLoggedInCount = (authMethods['already_logged_in'] ?? 0) + (authMethods['Already_Logged_In'] ?? 0)

  const getTreatmentCount = ec.get_treatment_clicked ?? 0
  const qCount = ec.questionnaire_pm ?? 0
  const cartCount = ec.cart_viewed ?? 0
  const cartAuthCount = ec.cart_auth_completed ?? 0
  const checkoutCount = ec.checkout_started ?? 0
  const orderCount = ec.order_success ?? 0
  const firstCount = getTreatmentCount
  const showCartAuth = guestCount > 0 || cartAuthCount > 0

  const cartAuthStatusBreakdown = (eventsData.paramBreakdowns?.cart_viewed?.cart_auth_status ?? {}) as Record<string, number>
  const cartSignedInCount = cartAuthStatusBreakdown['signed_in'] ?? 0
  const cartGuestCount = cartAuthStatusBreakdown['guest'] ?? 0

  return (
    <div style={{maxWidth: 700, margin: '0 auto'}}>
      <FlowNode icon="💊" label="Get Treatment" sublabel="get_treatment_clicked" count={getTreatmentCount} firstCount={firstCount} color="#22c55e" />

      <ThreeSplitLine leftColor="#7c3aed" centerColor="#16a34a" rightColor="#0284c7" />
      <div style={{display: 'flex', gap: 10}}>
        <div style={{flex: 1}}>
          <FlowNode icon="👤" label="Signup / Login" sublabel="signed-in path" count={signedInCount} firstCount={firstCount} color="#7c3aed" onClick={onAuthClick} />
        </div>
        <div style={{flex: 1}}>
          <FlowNode icon="🔓" label="Already Logged In" sublabel="already_logged_in" count={alreadyLoggedInCount} firstCount={firstCount} color="#16a34a" />
        </div>
        <div style={{flex: 1}}>
          <FlowNode icon="👻" label="Guest" sublabel="guest path" count={guestCount} firstCount={firstCount} color="#0284c7" />
        </div>
      </div>
      <ThreeMergeLine leftColor="#7c3aed" centerColor="#16a34a" rightColor="#0284c7" />

      <FlowNode icon="📋" label="PM Questionnaire" sublabel="questionnaire_pm" count={qCount} firstCount={firstCount} color="#a55eea" />

      {showCartAuth ? (
        <>
          <SplitLine leftColor="#d97706" rightColor="#0ea5e9" />
          <div style={{display: 'flex', gap: 10, alignItems: 'stretch'}}>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
              <FlowNode icon="🛒" label="Cart" sublabel="signed-in path" count={cartSignedInCount} firstCount={firstCount} color="#d97706" />
              <div style={{flex: 1, display: 'flex', justifyContent: 'center', padding: '4px 0', minHeight: 20}}>
                <div style={{width: 2, background: CON_COLOR, borderRadius: 1}} />
              </div>
            </div>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
              <FlowNode icon="🛒" label="Cart" sublabel="guest path" count={cartGuestCount} firstCount={firstCount} color="#0ea5e9" />
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0'}}>
                <div style={{width: 2, height: 10, background: CON_COLOR}} />
                <div style={{fontSize: 9, fontWeight: 600, color: '#7c3aed', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 20, padding: '2px 8px', margin: '2px 0'}}>
                  guest re-auth
                </div>
                <div style={{width: 2, height: 10, background: CON_COLOR}} />
              </div>
              <FlowNode icon="✅" label="Cart Auth" sublabel="cart_auth_completed" count={cartAuthCount} firstCount={firstCount} color="#7c3aed" onClick={onCartAuthClick} />
            </div>
          </div>
          <MergeLine leftColor="#d97706" rightColor="#7c3aed" />
        </>
      ) : (
        <>
          <DropConn from={qCount} to={cartCount} />
          <FlowNode icon="🛒" label="Cart" sublabel="cart_viewed" count={cartCount} firstCount={firstCount} color="#d97706" />
          <DropConn from={cartCount} to={checkoutCount} />
        </>
      )}

      <FlowNode icon="💳" label="Checkout" sublabel="checkout_started" count={checkoutCount} firstCount={firstCount} color="#26c0d3" />
      <DropConn from={checkoutCount} to={orderCount} />
      <FlowNode icon="🎉" label="Order Success" sublabel="order_success" count={orderCount} firstCount={firstCount} color="#22c55e" />
    </div>
  )
}

// ── Condition Detail flowchart — condition-first design ───────────────────

function ConditionDetailFlowchart({
  conditionData,
  cartData,
  cartLoading,
  selectedProduct,
  onProductSelect,
  onCartAuthClick,
  onAuthClick,
}: {
  conditionData: PmConditionEventsResponse
  cartData: PmProductCartResponse | null
  cartLoading: boolean
  selectedProduct: string | null
  onProductSelect: (name: string) => void
  onCartAuthClick?: () => void
  onAuthClick?: () => void
}) {
  const startAssessmentCount = conditionData.eventCounts.pm_start_assessment_clicked
  const authCount = conditionData.eventCounts.auth_completed
  const qCount = conditionData.eventCounts.questionnaire_pm
  const firstCount = startAssessmentCount
  const methodCounts = conditionData.paramBreakdowns.auth_completed.method

  const signedInCount = ['signup', 'Signup', 'sign_in', 'Sign In', 'signin', 'Signin', 'Sign_In'].reduce(
    (acc, k) => acc + (methodCounts[k] ?? 0), 0,
  )
  const guestCount = (methodCounts['guest'] ?? 0) + (methodCounts['Guest'] ?? 0)
  const alreadyLoggedInCount = (methodCounts['already_logged_in'] ?? 0) + (methodCounts['Already_Logged_In'] ?? 0)

  // Cart section (product-level)
  const cartCount = cartData?.eventCounts['cart_viewed'] ?? 0
  const cartAuthCount = cartData?.eventCounts['cart_auth_completed'] ?? 0
  const checkoutCount = cartData?.eventCounts['checkout_started'] ?? 0
  const orderCount = cartData?.eventCounts['order_success'] ?? 0
  const cartAuthStatusBreakdown = (cartData?.paramBreakdowns?.cart_viewed?.cart_auth_status ?? {}) as Record<string, number>
  const cartSignedInCount = cartAuthStatusBreakdown['signed_in'] ?? 0
  const cartGuestCount = cartAuthStatusBreakdown['guest'] ?? 0
  const showCartAuth = cartGuestCount > 0 || cartAuthCount > 0
  const cartFirst = cartCount

  return (
    <div style={{maxWidth: 700, margin: '0 auto'}}>
      <FlowNode icon="🩺" label="Start Assessment" sublabel="pm_start_assessment_clicked" count={startAssessmentCount} firstCount={firstCount} color="#22c55e" />
      <DropConn from={startAssessmentCount} to={authCount} />

      {/* ── Top funnel: condition-level ── */}
      <ThreeSplitLine leftColor="#7c3aed" centerColor="#16a34a" rightColor="#0284c7" />
      <div style={{display: 'flex', gap: 10}}>
        <div style={{flex: 1}}>
          <FlowNode icon="👤" label="Signup / Login" sublabel="signed-in path" count={signedInCount} firstCount={firstCount} color="#7c3aed" onClick={onAuthClick} />
        </div>
        <div style={{flex: 1}}>
          <FlowNode icon="🔓" label="Already Logged In" sublabel="already_logged_in" count={alreadyLoggedInCount} firstCount={firstCount} color="#16a34a" />
        </div>
        <div style={{flex: 1}}>
          <FlowNode icon="👻" label="Guest" sublabel="guest path" count={guestCount} firstCount={firstCount} color="#0284c7" />
        </div>
      </div>
      <ThreeMergeLine leftColor="#7c3aed" centerColor="#16a34a" rightColor="#0284c7" />

      <FlowNode icon="📋" label="PM Questionnaire" sublabel="questionnaire_pm" count={qCount} firstCount={firstCount} color="#a55eea" />

      {/* ── Products list ── */}
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0'}}>
        <div style={{width: 2, height: 20, background: CON_COLOR, borderRadius: 1}} />
        <div style={{fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 0'}}>
          Product Selected
        </div>
        <div style={{width: 2, height: 8, background: CON_COLOR, borderRadius: 1}} />
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '2px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{fontSize: 16}}>🎯</span>
          <div style={{fontSize: 12, fontWeight: 700, color: '#374151'}}>Products chosen in this condition</div>
          <div style={{marginLeft: 'auto', fontSize: 10, color: '#94a3b8'}}>
            {selectedProduct ? 'Click to change ↓' : 'Select a product to see cart funnel ↓'}
          </div>
        </div>
        {conditionData.products.length === 0 ? (
          <div style={{padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
            No product_selected events found for this condition
          </div>
        ) : (
          conditionData.products.map((p, i) => {
            const isSelected = selectedProduct === p.name
            const maxCount = conditionData.products[0]?.count ?? 1
            const pct = maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0
            return (
              <button
                key={p.name}
                onClick={() => onProductSelect(p.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < conditionData.products.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? '3px solid #4f8ef7' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#1d4ed8' : '#374151', flex: 1}}>
                  {p.name}
                </span>
                <div style={{width: 80, height: 4, borderRadius: 2, background: '#f0f2f5', overflow: 'hidden', flexShrink: 0}}>
                  <div style={{height: '100%', width: `${pct}%`, background: isSelected ? '#4f8ef7' : '#94a3b8', borderRadius: 2}} />
                </div>
                <span style={{fontSize: 12, fontWeight: 700, color: isSelected ? '#1d4ed8' : '#64748b', minWidth: 28, textAlign: 'right', flexShrink: 0}}>
                  {fNum(p.count)}
                </span>
                {isSelected && <span style={{fontSize: 10, color: '#4f8ef7', flexShrink: 0}}>▼</span>}
              </button>
            )
          })
        )}
      </div>

      {/* ── Cart funnel: product-level ── */}
      {selectedProduct && (
        <>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0'}}>
            <div style={{width: 2, height: 20, background: CON_COLOR, borderRadius: 1}} />
          </div>

          {cartLoading ? (
            <div style={{textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13}}>
              <div style={{width: 24, height: 24, borderRadius: '50%', border: '3px solid #e2e6ea', borderTopColor: '#4f8ef7', margin: '0 auto 10px', animation: 'spin 0.7s linear infinite', display: 'inline-block'}} />
              <div>Loading cart funnel…</div>
            </div>
          ) : cartData ? (
            showCartAuth ? (
              <>
                <SplitLine leftColor="#d97706" rightColor="#0ea5e9" />
                <div style={{display: 'flex', gap: 10, alignItems: 'stretch'}}>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <FlowNode icon="🛒" label="Cart" sublabel="signed-in path" count={cartSignedInCount} firstCount={cartFirst} color="#d97706" />
                    <div style={{flex: 1, display: 'flex', justifyContent: 'center', padding: '4px 0', minHeight: 20}}>
                      <div style={{width: 2, background: CON_COLOR, borderRadius: 1}} />
                    </div>
                  </div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <FlowNode icon="🛒" label="Cart" sublabel="guest path" count={cartGuestCount} firstCount={cartFirst} color="#0ea5e9" />
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0'}}>
                      <div style={{width: 2, height: 10, background: CON_COLOR}} />
                      <div style={{fontSize: 9, fontWeight: 600, color: '#7c3aed', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 20, padding: '2px 8px', margin: '2px 0'}}>
                        guest re-auth
                      </div>
                      <div style={{width: 2, height: 10, background: CON_COLOR}} />
                    </div>
                    <FlowNode icon="✅" label="Cart Auth" sublabel="cart_auth_completed" count={cartAuthCount} firstCount={cartFirst} color="#7c3aed" onClick={onCartAuthClick} />
                  </div>
                </div>
                <MergeLine leftColor="#d97706" rightColor="#7c3aed" />
                <FlowNode icon="💳" label="Checkout" sublabel="checkout_started" count={checkoutCount} firstCount={cartFirst} color="#26c0d3" />
                <DropConn from={checkoutCount} to={orderCount} />
                <FlowNode icon="🎉" label="Order Success" sublabel="order_success" count={orderCount} firstCount={cartFirst} color="#22c55e" />
              </>
            ) : (
              <>
                <FlowNode icon="🛒" label="Cart" sublabel="cart_viewed" count={cartCount} firstCount={cartFirst} color="#d97706" />
                <DropConn from={cartCount} to={checkoutCount} />
                <FlowNode icon="💳" label="Checkout" sublabel="checkout_started" count={checkoutCount} firstCount={cartFirst} color="#26c0d3" />
                <DropConn from={checkoutCount} to={orderCount} />
                <FlowNode icon="🎉" label="Order Success" sublabel="order_success" count={orderCount} firstCount={cartFirst} color="#22c55e" />
              </>
            )
          ) : null}
        </>
      )}
    </div>
  )
}

// ── Cart Auth Patient Records modal ──────────────────────────────────────

function CartAuthPatientModal({
  open,
  records,
  loading,
  error,
  onClose,
}: {
  open: boolean
  records: CartAuthPatientRecord[]
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  if (!open) return null

  const filteredRecords = records.filter((r) => r.user_name || r.user_email || r.user_phone || r.user_gender)

  const handleExportCSV = () => {
    const header = 'Date,Name,Email,Phone,Gender,Product,Condition'
    const rows = filteredRecords.map((r) => {
      const date = r.timestamp ? new Date(r.timestamp * 1000).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : ''
      return [date, r.user_name, r.user_email, r.user_phone, r.user_gender, r.product_name, r.condition_name]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], {type: 'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cart-auth-patients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{background: '#fff', borderRadius: 16, width: '92vw', maxWidth: 1100, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden'}}
      >
        {/* Header */}
        <div style={{padding: '20px 28px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)'}}>
          <div>
            <h3 style={{margin: 0, fontSize: 17, fontWeight: 700, color: '#111'}}>✅ Cart Auth Patient Records</h3>
            <p style={{margin: '4px 0 0', fontSize: 12, color: '#888'}}>
              cart_auth_completed · {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {filteredRecords.length > 0 && (
              <button
                onClick={handleExportCSV}
                style={{padding: '8px 16px', fontSize: 12, fontWeight: 600, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#059669' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#10b981' }}
              >
                📥 Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              style={{width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e6ea', background: '#f8f9fb', cursor: 'pointer', fontSize: 16, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8f9fb'; (e.currentTarget as HTMLButtonElement).style.color = '#888' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex: 1, overflowY: 'auto', padding: 0}}>
          {loading ? (
            <div style={{padding: 60, textAlign: 'center'}}>
              <div style={{width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'patientSpin 0.7s linear infinite'}} />
              <style>{`@keyframes patientSpin { to { transform: rotate(360deg) } }`}</style>
              <p style={{fontSize: 13, color: '#888'}}>Loading patient records…</p>
            </div>
          ) : error ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#ef4444'}}>⚠️ {error}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#888'}}>No cart auth records found for this selection.</p>
            </div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 12}}>
              <thead>
                <tr style={{background: '#f8f9fb', position: 'sticky', top: 0, zIndex: 1}}>
                  {['Date', 'Name', 'Email', 'Phone', 'Gender'].map((h) => (
                    <th key={h} style={{padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e8eaed', whiteSpace: 'nowrap'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                    <td style={{padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap'}}>
                      {r.timestamp ? new Date(r.timestamp * 1000).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '—'}
                    </td>
                    <td style={{padding: '10px 14px', fontWeight: 600, color: '#1e293b'}}>{r.user_name || '—'}</td>
                    <td style={{padding: '10px 14px', color: '#3b82f6'}}>{r.user_email || '—'}</td>
                    <td style={{padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap'}}>{r.user_phone || '—'}</td>
                    <td style={{padding: '10px 14px', color: '#374151'}}>{r.user_gender || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Auth Patient Modal ────────────────────────────────────────────────────

function AuthPatientModal({
  open,
  records,
  loading,
  error,
  onClose,
}: {
  open: boolean
  records: CartAuthPatientRecord[]
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  if (!open) return null

  const filteredRecords = records.filter((r) => r.user_name || r.user_email || r.user_phone || r.user_gender)

  const handleExportCSV = () => {
    const header = 'Date,Name,Email,Phone,Gender,Product,Condition'
    const rows = filteredRecords.map((r) => {
      const date = r.timestamp ? new Date(r.timestamp * 1000).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : ''
      return [date, r.user_name, r.user_email, r.user_phone, r.user_gender, r.product_name, r.condition_name]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], {type: 'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'auth-patients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'}}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{background: '#fff', borderRadius: 16, width: '92vw', maxWidth: 1100, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', overflow: 'hidden'}}
      >
        {/* Header */}
        <div style={{padding: '20px 28px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)'}}>
          <div>
            <h3 style={{margin: 0, fontSize: 17, fontWeight: 700, color: '#111'}}>👤 Auth Patient Records</h3>
            <p style={{margin: '4px 0 0', fontSize: 12, color: '#888'}}>
              auth_completed · {filteredRecords.length} patient{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {filteredRecords.length > 0 && (
              <button
                onClick={handleExportCSV}
                style={{padding: '8px 16px', fontSize: 12, fontWeight: 600, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#059669' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#10b981' }}
              >
                📥 Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              style={{width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e6ea', background: '#f8f9fb', cursor: 'pointer', fontSize: 16, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8f9fb'; (e.currentTarget as HTMLButtonElement).style.color = '#888' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex: 1, overflowY: 'auto', padding: 0}}>
          {loading ? (
            <div style={{padding: 60, textAlign: 'center'}}>
              <div style={{width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 16px', animation: 'patientSpin 0.7s linear infinite'}} />
              <p style={{fontSize: 13, color: '#888'}}>Loading patient records…</p>
            </div>
          ) : error ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#ef4444'}}>⚠️ {error}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center'}}>
              <p style={{fontSize: 13, color: '#888'}}>No patient records found for this selection.</p>
            </div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 12}}>
              <thead>
                <tr style={{background: '#f8f9fb', position: 'sticky', top: 0, zIndex: 1}}>
                  {['Date', 'Name', 'Email', 'Phone', 'Gender'].map((h) => (
                    <th key={h} style={{padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e8eaed', whiteSpace: 'nowrap'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, i) => {
                  const date = r.timestamp ? new Date(r.timestamp * 1000).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '—'
                  return (
                    <tr key={r.distinct_id + i} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={{padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap'}}>{date}</td>
                      <td style={{padding: '10px 14px', fontWeight: 600, color: '#1e293b'}}>{r.user_name || '—'}</td>
                      <td style={{padding: '10px 14px', color: '#3b82f6'}}>{r.user_email || '—'}</td>
                      <td style={{padding: '10px 14px', color: '#374151', whiteSpace: 'nowrap'}}>{r.user_phone || '—'}</td>
                      <td style={{padding: '10px 14px', color: '#374151'}}>{r.user_gender || '—'}</td>
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
}

// ── Flow selector tabs ────────────────────────────────────────────────────

function FlowTab({label, icon, desc, active, onClick}: {label: string; icon: string; desc: string; active: boolean; steps: string[]; onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '20px 22px',
        borderRadius: 12,
        border: active ? '2px solid #16a34a' : '2px solid #e5e7eb',
        background: active ? '#f0fdf4' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s',
        boxShadow: active ? '0 2px 10px rgba(22,163,74,0.10)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {active && (
        <div style={{position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 32px 32px 0', borderColor: `transparent #16a34a transparent transparent`}} />
      )}
      {active && (
        <span style={{position: 'absolute', top: 4, right: 4, fontSize: 9, color: '#fff', fontWeight: 800, lineHeight: 1}}>✓</span>
      )}
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: active ? '#16a34a' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
          transition: 'all 0.18s',
        }}>
          {icon}
        </div>
        <div>
          <div style={{fontSize: 14, fontWeight: 700, color: active ? '#14532d' : '#374151', lineHeight: 1.3, marginBottom: 3}}>{label}</div>
          <div style={{fontSize: 11.5, color: active ? '#16a34a' : '#9ca3af', fontWeight: 500, lineHeight: 1.4}}>{desc}</div>
        </div>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function PmFunnelTab({dateRange}: {apiUrl: string; dateRange: string}) {
  const [flowSource, setFlowSource] = useState<FlowSource>('product_detail')
  const [refreshKey, setRefreshKey] = useState(0)
  const [clearing, setClearing] = useState(false)

  // ── Product detail state ──
  const [pdFilterOptions, setPdFilterOptions] = useState<{name: string; id: number | null}[]>([])
  const [pdSelectedFilter, setPdSelectedFilter] = useState('')
  const [pdOptionsLoading, setPdOptionsLoading] = useState(true)
  const [pdEventsData, setPdEventsData] = useState<PmFunnelEventsResponse | null>(null)
  const [pdLoading, setPdLoading] = useState(false)
  const [pdError, setPdError] = useState<string | null>(null)

  // ── Condition detail state ──
  const [cdConditionOptions, setCdConditionOptions] = useState<{label: string; value: string}[]>([])
  const [cdSelectedConditionId, setCdSelectedConditionId] = useState('')
  const [cdOptionsLoading, setCdOptionsLoading] = useState(true)
  const [cdConditionData, setCdConditionData] = useState<PmConditionEventsResponse | null>(null)
  const [cdConditionLoading, setCdConditionLoading] = useState(false)
  const [cdConditionError, setCdConditionError] = useState<string | null>(null)
  const [cdSelectedProduct, setCdSelectedProduct] = useState<string | null>(null)
  const [cdCartData, setCdCartData] = useState<PmProductCartResponse | null>(null)
  const [cdCartLoading, setCdCartLoading] = useState(false)

  // ── Cart auth modal state ──
  const [cartAuthModalOpen, setCartAuthModalOpen] = useState(false)
  const [cartAuthPatients, setCartAuthPatients] = useState<CartAuthPatientRecord[]>([])
  const [cartAuthPatientsLoading, setCartAuthPatientsLoading] = useState(false)
  const [cartAuthPatientsError, setCartAuthPatientsError] = useState<string | null>(null)

  // ── Auth modal state ──
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authPatients, setAuthPatients] = useState<CartAuthPatientRecord[]>([])
  const [authPatientsLoading, setAuthPatientsLoading] = useState(false)
  const [authPatientsError, setAuthPatientsError] = useState<string | null>(null)

  const handleFetchLatest = useCallback(async () => {
    setClearing(true)
    try {
      await clearMixpanelCache(MIXPANEL_API_URL)
    } catch (err) {
      console.error('PM funnel clear-cache error:', err)
    } finally {
      setClearing(false)
      setRefreshKey((k) => k + 1)
    }
  }, [])

  // ── Product detail: load options ──
  useEffect(() => {
    if (flowSource !== 'product_detail') return
    const controller = new AbortController()
    setPdOptionsLoading(true)
    setPdSelectedFilter('')
    setPdEventsData(null)
    fetchPmFunnelProducts(MIXPANEL_API_URL, dateRange as DateRange, 'product_detail', controller.signal)
      .then((values) => { if (!controller.signal.aborted) { setPdFilterOptions(values); setPdOptionsLoading(false) } })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('PM funnel PD options error:', err)
        if (!controller.signal.aborted) setPdOptionsLoading(false)
      })
    return () => controller.abort()
  }, [dateRange, flowSource, refreshKey])

  // ── Product detail: fetch events ──
  useEffect(() => {
    if (flowSource !== 'product_detail' || !pdSelectedFilter) { setPdEventsData(null); setPdLoading(false); return }
    const controller = new AbortController()
    setPdLoading(true)
    setPdError(null)
    fetchPmFunnelEvents(MIXPANEL_API_URL, dateRange as DateRange, pdSelectedFilter, 'product_detail', controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setPdEventsData(data); setPdLoading(false) } })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!controller.signal.aborted) { setPdError(err instanceof Error ? err.message : String(err)); setPdLoading(false) }
      })
    return () => controller.abort()
  }, [pdSelectedFilter, dateRange, flowSource, refreshKey])

  // ── Condition detail: load condition options (IDs from Mixpanel, names from Sanity) ──
  useEffect(() => {
    if (flowSource !== 'condition_detail') return
    const controller = new AbortController()
    setCdOptionsLoading(true)
    setCdSelectedConditionId('')
    setCdConditionData(null)
    setCdSelectedProduct(null)
    setCdCartData(null)
    Promise.all([
      fetchPmConditionOptions(MIXPANEL_API_URL, dateRange as DateRange, controller.signal),
      sanityClient.fetch<{conditionId: number; title: string}[]>(
        `*[_type == "singleCondition" && defined(conditionId)]{conditionId, title}`
      ),
    ])
      .then(([ids, sanityConditions]) => {
        if (controller.signal.aborted) return
        const nameMap = new Map<number, string>()
        sanityConditions.forEach((c) => { if (c.conditionId) nameMap.set(c.conditionId, c.title) })
        const opts = ids.map((id) => ({
          value: String(id),
          label: nameMap.get(id) ?? `Condition ${id}`,
        })).sort((a, b) => a.label.localeCompare(b.label))
        setCdConditionOptions(opts)
        setCdOptionsLoading(false)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('PM funnel CD options error:', err)
        if (!controller.signal.aborted) setCdOptionsLoading(false)
      })
    return () => controller.abort()
  }, [dateRange, flowSource, refreshKey])

  // ── Condition detail: fetch condition-level funnel ──
  useEffect(() => {
    if (flowSource !== 'condition_detail' || !cdSelectedConditionId) {
      setCdConditionData(null)
      setCdSelectedProduct(null)
      setCdCartData(null)
      setCdConditionLoading(false)
      return
    }
    const controller = new AbortController()
    setCdConditionLoading(true)
    setCdConditionError(null)
    setCdSelectedProduct(null)
    setCdCartData(null)
    fetchPmConditionEvents(MIXPANEL_API_URL, dateRange as DateRange, Number(cdSelectedConditionId), controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setCdConditionData(data); setCdConditionLoading(false) } })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!controller.signal.aborted) { setCdConditionError(err instanceof Error ? err.message : String(err)); setCdConditionLoading(false) }
      })
    return () => controller.abort()
  }, [cdSelectedConditionId, dateRange, flowSource, refreshKey])

  // ── Condition detail: fetch cart funnel for selected product ──
  const handleProductSelect = useCallback((productName: string) => {
    if (productName === cdSelectedProduct) return
    setCdSelectedProduct(productName)
    setCdCartData(null)
    setCdCartLoading(true)
    fetchPmProductCart(MIXPANEL_API_URL, dateRange as DateRange, Number(cdSelectedConditionId), productName)
      .then((data) => { setCdCartData(data); setCdCartLoading(false) })
      .catch((err) => { console.error('PM funnel cart error:', err); setCdCartLoading(false) })
  }, [cdSelectedConditionId, cdSelectedProduct, dateRange])

  // ── Cart auth patient modal handlers ──
  const handlePdCartAuthClick = useCallback(() => {
    if (!pdSelectedFilter) return
    setCartAuthModalOpen(true)
    setCartAuthPatientsLoading(true)
    setCartAuthPatientsError(null)
    setCartAuthPatients([])
    fetchCartAuthPatients(MIXPANEL_API_URL, dateRange as DateRange, {flowSource: 'product_detail', product: pdSelectedFilter})
      .then((records) => { setCartAuthPatients(records); setCartAuthPatientsLoading(false) })
      .catch((err) => { setCartAuthPatientsError(err instanceof Error ? err.message : String(err)); setCartAuthPatientsLoading(false) })
  }, [pdSelectedFilter, dateRange])

  const handleCdCartAuthClick = useCallback(() => {
    if (!cdSelectedProduct || !cdSelectedConditionId) return
    setCartAuthModalOpen(true)
    setCartAuthPatientsLoading(true)
    setCartAuthPatientsError(null)
    setCartAuthPatients([])
    fetchCartAuthPatients(MIXPANEL_API_URL, dateRange as DateRange, {flowSource: 'condition_detail', product: cdSelectedProduct, conditionId: Number(cdSelectedConditionId)})
      .then((records) => { setCartAuthPatients(records); setCartAuthPatientsLoading(false) })
      .catch((err) => { setCartAuthPatientsError(err instanceof Error ? err.message : String(err)); setCartAuthPatientsLoading(false) })
  }, [cdSelectedConditionId, cdSelectedProduct, dateRange])

  // ── Auth patient modal handlers ──
  const handlePdAuthClick = useCallback(() => {
    if (!pdSelectedFilter) return
    setAuthModalOpen(true)
    setAuthPatientsLoading(true)
    setAuthPatientsError(null)
    setAuthPatients([])
    fetchAuthPatients(MIXPANEL_API_URL, dateRange as DateRange, {flowSource: 'product_detail', product: pdSelectedFilter})
      .then((records) => { setAuthPatients(records); setAuthPatientsLoading(false) })
      .catch((err) => { setAuthPatientsError(err instanceof Error ? err.message : String(err)); setAuthPatientsLoading(false) })
  }, [pdSelectedFilter, dateRange])

  const handleCdAuthClick = useCallback(() => {
    if (!cdSelectedConditionId) return
    setAuthModalOpen(true)
    setAuthPatientsLoading(true)
    setAuthPatientsError(null)
    setAuthPatients([])
    fetchAuthPatients(MIXPANEL_API_URL, dateRange as DateRange, {flowSource: 'condition_detail', conditionId: Number(cdSelectedConditionId)})
      .then((records) => { setAuthPatients(records); setAuthPatientsLoading(false) })
      .catch((err) => { setAuthPatientsError(err instanceof Error ? err.message : String(err)); setAuthPatientsLoading(false) })
  }, [cdSelectedConditionId, dateRange])

  // ── Product detail summary stats ──
  const pdFunnelEvents = [...PM_PRODUCT_DETAIL_EVENTS]
  const pdAuthMethods = pdEventsData?.paramBreakdowns?.auth_completed?.method ?? {}
  const pdGuestCount = (pdAuthMethods['guest'] ?? 0) + (pdAuthMethods['Guest'] ?? 0)
  const pdCartAuthCount = pdEventsData?.eventCounts?.cart_auth_completed ?? 0
  const pdShowCartAuth = pdGuestCount > 0 || pdCartAuthCount > 0
  const pdFunnelSteps = pdEventsData
    ? pdFunnelEvents
        .filter((evt) => evt !== 'cart_auth_completed' || pdShowCartAuth)
        .map((evt) => ({event: evt, count: pdEventsData.eventCounts[evt] ?? 0}))
    : []
  const pdFirstCount = pdFunnelSteps[0]?.count ?? 0
  const pdTotalCompleted = pdFunnelSteps[pdFunnelSteps.length - 1]?.count ?? 0
  const pdOverallConversion = pdFirstCount > 0 ? Math.round((pdTotalCompleted / pdFirstCount) * 100) : 0

  // Condition detail breakdown items (auth method + product selection + cart auth status)
  const cdBreakdownItems: Array<{event: string; count: number; breakdown: Record<string, Record<string, number>>}> = []
  if (cdConditionData) {
    cdBreakdownItems.push({
      event: 'auth_completed',
      count: cdConditionData.eventCounts.auth_completed,
      breakdown: cdConditionData.paramBreakdowns.auth_completed as unknown as Record<string, Record<string, number>>,
    })

  }

  const loading = flowSource === 'product_detail' ? pdLoading : cdConditionLoading
  const error = flowSource === 'product_detail' ? pdError : cdConditionError

  return (
    <div style={{fontFamily: 'system-ui, sans-serif', color: '#111'}}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
        borderRadius: 16,
        padding: '22px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(22,101,52,0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)'}} />
        <div style={{position: 'absolute', right: 60, bottom: -40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)'}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 14, position: 'relative'}}>
          <div style={{width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0}}>
            💊
          </div>
          <div>
            <div style={{fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px'}}>Private Medication Funnel</div>
            <div style={{fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3}}>
              Track patient journeys across Get Treatment &amp; Start Assessment entry flows
            </div>
          </div>
        </div>
        <div style={{display: 'flex', gap: 10, position: 'relative'}}>
          <div style={{background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', backdropFilter: 'blur(4px)'}}>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Active Flow</div>
            <div style={{fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2}}>
              {flowSource === 'product_detail' ? '🛍️ Get Treatment' : '🩺 Start Assessment'}
            </div>
          </div>
        </div>
      </div>

      {/* Flow selector */}
      <div style={{background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', marginBottom: 12}}>
        <div style={{fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14}}>
          Select Entry Flow
        </div>
        <div style={{display: 'flex', gap: 14}}>
          <FlowTab
            label="Get Treatment Entry"
            icon="🛍️"
            desc="Via product card or detail page"
            steps={[]}
            active={flowSource === 'product_detail'}
            onClick={() => setFlowSource('product_detail')}
          />
          <FlowTab
            label="Start Assessment Entry"
            icon="🩺"
            desc="Via condition detail page"
            steps={[]}
            active={flowSource === 'condition_detail'}
            onClick={() => setFlowSource('condition_detail')}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '16px 24px', marginBottom: 24}}>
        <div style={{fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10}}>
          {flowSource === 'product_detail' ? 'Step 1 — Product' : 'Step 1 — Condition'}
        </div>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, width: 'fit-content'}}>
          <div style={{minWidth: 240}}>
            {flowSource === 'product_detail' ? (
              <CustomSelect
                label=""
                value={pdSelectedFilter}
                options={pdFilterOptions.map((p) => ({value: p.name, label: p.name}))}
                placeholder={pdOptionsLoading ? 'Loading products…' : 'Select a product…'}
                loading={pdOptionsLoading}
                disabled={pdOptionsLoading}
                onChange={setPdSelectedFilter}
              />
            ) : (
              <CustomSelect
                label=""
                value={cdSelectedConditionId}
                options={cdConditionOptions}
                placeholder={cdOptionsLoading ? 'Loading conditions…' : 'Select a condition…'}
                loading={cdOptionsLoading}
                disabled={cdOptionsLoading}
                onChange={setCdSelectedConditionId}
              />
            )}
          </div>

          <button
            onClick={handleFetchLatest}
            disabled={clearing || loading}
            style={{
              padding: '10px 20px',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              background: clearing || loading ? '#6ee7b7' : '#10b981',
              border: 'none',
              borderRadius: 10,
              cursor: clearing || loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s',
              boxShadow: clearing || loading ? 'none' : '0 2px 8px rgba(16,185,129,0.25)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!clearing && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#059669' }}
            onMouseLeave={(e) => { if (!clearing && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#10b981' }}
          >
            <span style={{display: 'inline-block', animation: clearing || loading ? 'spin 0.7s linear infinite' : 'none', fontSize: 14}}>↻</span>
            {clearing ? 'Clearing…' : 'Fetch Latest'}
          </button>
        </div>

        {/* Summary stats — product detail only */}
        {flowSource === 'product_detail' && pdEventsData && pdFirstCount > 0 && (
          <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6'}}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '8px 14px',
            }}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#16a34a'}} />
              <div>
                <span style={{fontSize: 16, fontWeight: 800, color: '#16a34a'}}>{fNum(pdFirstCount)}</span>
                <span style={{fontSize: 10, color: '#4b7c5e', fontWeight: 600, marginLeft: 5, textTransform: 'uppercase'}}>Started</span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: pdOverallConversion >= 30 ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${pdOverallConversion >= 30 ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 10, padding: '8px 14px',
            }}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: pdOverallConversion >= 30 ? '#16a34a' : '#dc2626'}} />
              <div>
                <span style={{fontSize: 16, fontWeight: 800, color: pdOverallConversion >= 30 ? '#16a34a' : '#dc2626'}}>{pdOverallConversion}%</span>
                <span style={{fontSize: 10, color: pdOverallConversion >= 30 ? '#4b7c5e' : '#991b1b', fontWeight: 600, marginLeft: 5, textTransform: 'uppercase'}}>Conversion</span>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '8px 14px',
            }}>
              <div style={{width: 8, height: 8, borderRadius: '50%', background: '#0284c7'}} />
              <div>
                <span style={{fontSize: 16, fontWeight: 800, color: '#0284c7'}}>{fNum(pdTotalCompleted)}</span>
                <span style={{fontSize: 10, color: '#0369a1', fontWeight: 600, marginLeft: 5, textTransform: 'uppercase'}}>Orders</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14}}>
          <div style={{width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e6ea', borderTopColor: '#20bf6b', margin: '0 auto 16px', animation: 'spin 0.7s linear infinite', display: 'inline-block'}} />
          <div>Loading PM funnel data…</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', color: '#dc2626', fontSize: 13}}>
          ⚠ {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && (
        <>
          {flowSource === 'product_detail' && !pdSelectedFilter && (
            <div style={{textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14}}>
              <div style={{fontSize: 40, marginBottom: 12}}>🛍️</div>
              <div style={{fontWeight: 600, color: '#555', marginBottom: 6}}>Select a product to view the PM funnel</div>
              <div style={{fontSize: 12}}>
                {pdOptionsLoading ? 'Loading available products…' : `${pdFilterOptions.length} product${pdFilterOptions.length !== 1 ? 's' : ''} available`}
              </div>
            </div>
          )}
          {flowSource === 'condition_detail' && !cdSelectedConditionId && (
            <div style={{textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 14}}>
              <div style={{fontSize: 40, marginBottom: 12}}>🩺</div>
              <div style={{fontWeight: 600, color: '#555', marginBottom: 6}}>Select a condition to view the PM funnel</div>
              <div style={{fontSize: 12}}>
                {cdOptionsLoading ? 'Loading available conditions…' : `${cdConditionOptions.length} condition${cdConditionOptions.length !== 1 ? 's' : ''} available`}
              </div>
            </div>
          )}
        </>
      )}

      {/* Product detail flowchart */}
      {!loading && !error && flowSource === 'product_detail' && pdSelectedFilter && pdEventsData && (
        <>
          {pdFirstCount === 0 ? (
            <div style={{textAlign: 'center', padding: '48px 0', color: '#aaa', fontSize: 13}}>
              <div style={{fontSize: 32, marginBottom: 10}}>📭</div>
              <div style={{fontWeight: 600, color: '#555', marginBottom: 4}}>No PM events found</div>
              <div>No events for "{pdSelectedFilter}" in this date range.</div>
            </div>
          ) : (
            <>
              <ProductDetailFlowchart eventsData={pdEventsData} onCartAuthClick={handlePdCartAuthClick} onAuthClick={handlePdAuthClick} />
              <div style={{marginTop: 32}}>
                <div style={{fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #e5e7eb'}}>
                  📊 Detailed Event Breakdown
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                  {pdFunnelSteps
                    .filter((step) => !['questionnaire_pm', 'cart_viewed', 'checkout_started', 'order_success'].includes(step.event))
                    .map((step) => {
                      const bd = pdEventsData.paramBreakdowns[step.event]
                      const color = PM_FUNNEL_EVENT_COLOR[step.event] ?? '#888'
                      const icon = PM_FUNNEL_EVENT_ICON[step.event] ?? '📊'
                      const label = PM_FUNNEL_EVENT_LABEL[step.event] ?? step.event
                      if (!bd) return null
                      return (
                        <div
                          key={step.event}
                          style={{background: '#fff', borderRadius: 12, border: '1.5px solid #e8eaed', borderLeft: `4px solid ${color}`, overflow: 'hidden'}}
                        >
                          <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: `${color}08`, borderBottom: `1px solid ${color}22`}}>
                            <span style={{fontSize: 18}}>{icon}</span>
                            <div style={{fontSize: 13, fontWeight: 700, color: '#111'}}>{label}</div>
                            <div style={{marginLeft: 'auto', fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 8, padding: '2px 10px'}}>
                              {fNum(step.count)} events
                            </div>
                          </div>
                          <PmParamBreakdown color={color} breakdown={bd} />
                        </div>
                      )
                    })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Condition detail flowchart + breakdown */}
      {!loading && !error && flowSource === 'condition_detail' && cdSelectedConditionId && cdConditionData && (
        <>
          <ConditionDetailFlowchart
            conditionData={cdConditionData}
            cartData={cdCartData}
            cartLoading={cdCartLoading}
            selectedProduct={cdSelectedProduct}
            onProductSelect={handleProductSelect}
            onCartAuthClick={cdSelectedProduct ? handleCdCartAuthClick : undefined}
            onAuthClick={handleCdAuthClick}
          />
          {cdBreakdownItems.length > 0 && (
            <div style={{marginTop: 32}}>
              <div style={{fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #e5e7eb'}}>
                📊 Detailed Event Breakdown
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                {cdBreakdownItems.map((item) => {
                  const color = PM_FUNNEL_EVENT_COLOR[item.event] ?? '#888'
                  const icon = PM_FUNNEL_EVENT_ICON[item.event] ?? '📊'
                  const label = PM_FUNNEL_EVENT_LABEL[item.event] ?? item.event
                  return (
                    <div
                      key={item.event}
                      style={{background: '#fff', borderRadius: 12, border: '1.5px solid #e8eaed', borderLeft: `4px solid ${color}`, overflow: 'hidden'}}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: `${color}08`, borderBottom: `1px solid ${color}22`}}>
                        <span style={{fontSize: 18}}>{icon}</span>
                        <div style={{fontSize: 13, fontWeight: 700, color: '#111'}}>{label}</div>
                        <div style={{marginLeft: 'auto', fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 8, padding: '2px 10px'}}>
                          {fNum(item.count)} events
                        </div>
                      </div>
                      <PmParamBreakdown color={color} breakdown={item.breakdown} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <CartAuthPatientModal
        open={cartAuthModalOpen}
        records={cartAuthPatients}
        loading={cartAuthPatientsLoading}
        error={cartAuthPatientsError}
        onClose={() => setCartAuthModalOpen(false)}
      />
      <AuthPatientModal
        open={authModalOpen}
        records={authPatients}
        loading={authPatientsLoading}
        error={authPatientsError}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  )
}
