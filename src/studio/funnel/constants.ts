export const FUNNEL_EVENT_COLOR: Record<string, string> = {
  condition_viewed: '#4f8ef7',
  eligibility_checked: '#3ecf8e',
  start_assessment_clicked: '#a55eea',
  questionnaire_flow_step: '#f6b93b',
}

export const FUNNEL_EVENT_ICON: Record<string, string> = {
  condition_viewed: '👁️',
  eligibility_checked: '✅',
  start_assessment_clicked: '🚀',
  questionnaire_flow_step: '📋',
}

export const FUNNEL_EVENT_DESC: Record<string, string> = {
  condition_viewed: 'Users who viewed this condition page',
  eligibility_checked: 'Completed the eligibility check form',
  start_assessment_clicked: 'Clicked to start the pre-consult assessment',
  questionnaire_flow_step: 'Entered at least one pre-consult journey',
}

export interface FunnelRow {
  event: string
  label: string
  count: number
  isStep: boolean
}

export const QFS_STEP_LABEL: Record<string, string> = {
  questionnaire_submitted: 'Questionnaire Submitted',
  booking_completed: 'Booking Completed',
  sign_up_form_submission: 'Sign Up Form Submission',
}

export const QFS_FLOW_SEGMENT_LABEL: Record<string, string> = {
  sign_up: 'Sign Up',
  questionnaire_submit: 'Questionnaire Submit',
  appointment_booking: 'Appointment Booking',
}

export function formatFlowLabel(flowKey: string): string {
  return flowKey
    .split(',')
    .map(
      (s) =>
        QFS_FLOW_SEGMENT_LABEL[s.trim()] ??
        s
          .trim()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(' → ')
}

export interface QfsFlowEntry {
  flowKey: string
  label: string
  steps: {step: string; label: string; count: number}[]
}

/* ─── Private Medication Funnel Constants ─────────────────────────────── */

// Product Detail flow: Get Treatment → Auth → Questionnaire → Cart → (Cart Auth) → Checkout → Order
export const PM_PRODUCT_DETAIL_EVENTS = [
  'get_treatment_clicked',
  'auth_completed',
  'questionnaire_pm',
  'cart_viewed',
  'cart_auth_completed', // guest path only – shown conditionally
  'checkout_started',
  'order_success',
] as const

// Condition Detail flow: Start Assessment → Auth → Questionnaire → Choose Product → Cart → (Cart Auth) → Checkout → Order
export const PM_CONDITION_DETAIL_EVENTS = [
  'pm_start_assessment_clicked',
  'auth_completed',
  'questionnaire_pm',
  'product_selected',
  'cart_viewed',
  'cart_auth_completed', // guest path only – shown conditionally
  'checkout_started',
  'order_success',
] as const

// Legacy combined list (kept for type safety in shared breakdown section)
export const PM_FUNNEL_EVENTS = [
  'get_treatment_clicked',
  'auth_completed',
  'questionnaire_pm',
  'product_selected',
  'cart_viewed',
  'cart_auth_completed',
  'checkout_started',
  'order_success',
] as const

export const PM_FUNNEL_EVENT_COLOR: Record<string, string> = {
  pm_start_assessment_clicked: '#0ea5e9',
  get_treatment_clicked: '#22c55e',
  auth_completed: '#3ecf8e',
  questionnaire_pm: '#a55eea',
  product_selected: '#f43f5e',
  cart_viewed: '#f6b93b',
  checkout_started: '#26c0d3',
  cart_auth_completed: '#fd9644',
  order_success: '#20bf6b',
}

export const PM_FUNNEL_EVENT_ICON: Record<string, string> = {
  pm_start_assessment_clicked: '🩺',
  get_treatment_clicked: '💊',
  auth_completed: '🔐',
  questionnaire_pm: '📋',
  product_selected: '🎯',
  cart_viewed: '🛒',
  checkout_started: '💳',
  cart_auth_completed: '✅',
  order_success: '🎉',
}

export const PM_FUNNEL_EVENT_LABEL: Record<string, string> = {
  pm_start_assessment_clicked: 'Start Assessment',
  get_treatment_clicked: 'Get Treatment',
  auth_completed: 'Auth Completed',
  questionnaire_pm: 'PM Questionnaire',
  product_selected: 'Choose Product',
  cart_viewed: 'Cart Viewed',
  checkout_started: 'Checkout Started',
  cart_auth_completed: 'Cart Auth Completed',
  order_success: 'Order Success',
}

export const PM_FUNNEL_EVENT_DESC: Record<string, string> = {
  pm_start_assessment_clicked: 'Clicked "Start Assessment" on a condition detail page',
  get_treatment_clicked: 'Clicked "Get Treatment" on a product card or detail page',
  auth_completed: 'Completed authentication (signup, sign-in, or guest)',
  questionnaire_pm: 'Completed the private medication questionnaire',
  product_selected: 'Chose a product from the condition-based drug selection screen',
  cart_viewed: 'Viewed their cart with a PM product',
  checkout_started: 'Started the checkout process',
  cart_auth_completed: 'Completed authentication at cart (guest re-auth)',
  order_success: 'Successfully placed a private medication order',
}

/* ──────────────────────────────────────────────────────────────────────── */

/** Returns a value-specific bar color for known categorical params; falls back to the event color. */
export function getValueBarColor(pk: string, value: string, fallback: string): string {
  const key = pk.toLowerCase()
  const val = value.toLowerCase()
  if (key === 'gender' || key === 'sex' || key === 'user_gender') {
    if (val === 'female') return '#ec4899'
    if (val === 'male') return '#3b82f6'
  }
  if (key === 'status' || key === 'eligibility_status') {
    if (val === 'passed' || val === 'pass') return '#10b981'
    if (val === 'failed' || val === 'fail') return '#ef4444'
  }
  return fallback
}

const DATE_RE_FUNNEL = /^\d{4}-\d{2}-\d{2}(T[\d:]+)?$/
export function fVal(_key: string, value: string): string {
  if (!value) return '(not set)'
  if (DATE_RE_FUNNEL.test(value)) {
    const d = new Date(value)
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const MIXPANEL_API_URL =
  typeof window !== 'undefined' &&
  (window as Window & {__MIXPANEL_API_URL__?: string}).__MIXPANEL_API_URL__
    ? (window as Window & {__MIXPANEL_API_URL__?: string}).__MIXPANEL_API_URL__!
    : '/api/mixpanel'
