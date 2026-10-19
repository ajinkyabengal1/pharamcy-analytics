import type {DateRange} from '../ga-types'

export const DATE_RANGES: {label: string; value: DateRange}[] = [
  {label: '7d', value: '7'},
  {label: '14d', value: '14'},
  {label: '30d', value: '30'},
  {label: '90d', value: '90'},
]

export const PALETTE = [
  '#4f8ef7',
  '#3ecf8e',
  '#f6b93b',
  '#e55353',
  '#a55eea',
  '#26c0d3',
  '#fd9644',
  '#20bf6b',
]

export const DEVICE_COLORS: Record<string, string> = {
  desktop: '#4f8ef7',
  mobile: '#3ecf8e',
  tablet: '#f6b93b',
}
export const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#3ecf8e',
  Direct: '#4f8ef7',
  Referral: '#f6b93b',
  'Organic Social': '#e55353',
  Email: '#a55eea',
  'Paid Search': '#26c0d3',
  Display: '#fd9644',
}

export const METRIC_INFO: Record<string, string> = {
  'Total Users': 'Unique users who visited your site in the selected period.',
  'New Users': 'First-time visitors — users who have never visited before.',
  Sessions: 'Total browsing sessions. One user can have multiple sessions.',
  'Page Views': 'Total pages viewed, including repeated views of the same page.',
  'Avg. Duration': 'Average time a user spends in a single session.',
  'Bounce Rate': 'Percentage of sessions where the user left without any interaction.',
  'Engaged Sessions': 'Sessions lasting 10+ seconds, or with a conversion, or 2+ page views.',
  'Engagement Rate': 'Percentage of total sessions that were engaged sessions.',
  'Pages / Session': 'Average number of pages a user views per session.',
  'Events / Session': 'Average number of events (clicks, scrolls, etc.) fired per session.',
}

export const SECTION_INFO: Record<string, string> = {
  'Users & Sessions Over Time':
    'Daily breakdown of users, sessions and page views over the selected date range.',
  'Traffic by Hour — Today': 'How traffic is distributed across each hour of today.',
  'Channel Grouping':
    'Which marketing channels are driving sessions (Organic, Direct, Social, etc.).',
  'Top Pages': 'Most visited pages ranked by page view count.',
  'Top Landing Pages':
    'First pages users arrive on, ranked by session count. High bounce rate may indicate poor landing experience.',
  Devices: 'Share of sessions split by device type (desktop, mobile, tablet).',
  'New vs Returning': 'Ratio of first-time visitors to users who have visited before.',
  Browsers: 'Which web browsers your visitors are using.',
  'Operating Systems': 'Which operating systems your visitors are running.',
  'Top Events': 'All events fired on your site (clicks, scrolls, form submits, custom events).',
  'Top Countries': 'Countries your users are visiting from, ranked by user count.',
  'Top Cities': 'Cities your users are visiting from, ranked by user count.',
  'Traffic Sources': 'Source and medium pairs showing where your traffic originates.',
  'Top Referrers': 'Specific pages on other websites that linked to your site.',
  'Top Conditions':
    'Conditions ranked by the number of `condition_viewed` events. Includes per-event counts and assessment-start conversion rate.',
  'Top Products':
    'Products ranked by the number of `product_viewed` events. Includes per-event counts and order-success conversion rate.',
  'Conditions & Products Overview':
    'High-level KPIs across all condition and product events tracked in the funnel.',
}

export const CUSTOM_EVENT_GROUPS: {label: string; icon: string; events: string[]}[] = [
  {
    label: 'Funnel',
    icon: '⬡',
    events: [
      'condition_viewed',
      'eligibility_checked',
      'start_assessment_clicked',
      'questionnaire_flow_step',
    ],
  },
  {
    label: 'Branch',
    icon: '🏪',
    events: ['branch_assigned', 'branch_changed'],
  },
  {
    label: 'Condition',
    icon: '💊',
    events: ['condition_viewed', 'condition_selected', 'condition_searched'],
  },
  {
    label: 'Eligibility',
    icon: '✓',
    events: ['eligibility_checked', 'recheck_eligibility_clicked', 'start_assessment_clicked'],
  },
  {
    label: 'Questionnaire / PDS',
    icon: '📋',
    events: [
      'questionnaire_flow_step',
      'flow_abandoned',
      'pds_check_records_clicked',
      'pds_check_submitted',
      'pds_check_result',
      'pds_enter_new_contact_toggled',
      'pds_continue_private_toggled',
      'pds_try_again_clicked',
      'new_contact_details_submitted',
      'signup_result',
    ],
  },
]

export const PARAM_LABEL: Record<string, string> = {
  gender: 'Gender',
  status: 'Status',
  payment_method: 'Payment Method',
  delivery_option: 'Delivery Option',
  view: 'Auth View',
  is_nhs: 'NHS',
  pds_matched: 'PDS Matched',
  eligibility_status: 'Eligibility Status',
  action: 'Cart Action',
  enabled: 'Toggle State',
  assignment_type: 'Assignment Type',
  payment_mode: 'Payment Mode',
  previous_status: 'Previous Status',
  condition_name: 'Top Conditions',
  product_name: 'Top Products',
  step: 'Flow Step',
  last_step: 'Drop-off Step',
  source: 'Source',
  branch_corporate_id: 'Branch',
  search_term: 'Search Terms',
  results_count: 'Results Count',
  drug_variant: 'Drug Variant',
  discount_code: 'Discount Codes',
  new_quantity: 'New Quantity',
}

export const DONUT_KEYS = new Set([
  'gender',
  'status',
  'payment_method',
  'delivery_option',
  'view',
  'is_nhs',
  'pds_matched',
  'eligibility_status',
  'action',
  'enabled',
  'assignment_type',
  'payment_mode',
  'previous_status',
])

export const BAR_KEYS = new Set([
  'condition_name',
  'product_name',
  'step',
  'last_step',
  'source',
  'branch_corporate_id',
  'drug_variant',
  'discount_code',
  'search_term',
  'results_count',
  'new_quantity',
])

export const SKIP_KEYS = new Set([
  'branch_name',
  'product_name',
  'payment_mode',
  'payment_method',
  'delivery_option',
  'discount_code',
  'drug_variant',
  'condition_slug',
  'date_of_birth',
])

export type Tab =
  | 'overview'
  | 'traffic'
  | 'content'
  | 'audience'
  | 'geography'
  | 'events'
  | 'acquisition'
  | 'funnel'
  | 'pm-funnel'
  | 'conditions-products'

export const TABS: {id: Tab; label: string; icon: string}[] = [
  {id: 'overview', label: 'Overview', icon: '▦'},
  {id: 'traffic', label: 'Traffic', icon: '↗'},
  {id: 'content', label: 'Content', icon: '≡'},
  {id: 'audience', label: 'Audience', icon: '◉'},
  {id: 'geography', label: 'Geography', icon: '⊕'},
  {id: 'events', label: 'Events', icon: '⚡'},
  {id: 'acquisition', label: 'Acquisition', icon: '⤴'},
  {id: 'conditions-products', label: 'Overview', icon: '🧬'},
  {id: 'funnel', label: 'Pre Consult Events', icon: '⬡'},
  {id: 'pm-funnel', label: 'PM Funnel Events', icon: '💊'},
]

export const fNum = (n: number) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
      ? `${(n / 1e3).toFixed(1)}K`
      : n.toLocaleString()

export const fDur = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export const fPct = (v: number) => `${(v * 100).toFixed(1)}%`
export const fEngPct = (v: number) => `${(v * 100).toFixed(0)}%`

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Recharts `interval` that shows every Nth tick so labels stay evenly spaced
 * (`preserveStartEnd` forces the last tick, which squeezes the final gap).
 */
export const evenTickInterval = (count: number, maxTicks = 8): number =>
  Math.max(0, Math.ceil(count / maxTicks) - 1)

export const formatDateTick = (v: string): string => {
  if (!v || typeof v !== 'string') return ''
  // ISO format: YYYY-MM-DD
  if (v.length === 10 && v[4] === '-' && v[7] === '-') {
    const m = parseInt(v.slice(5, 7), 10) - 1
    const d = parseInt(v.slice(8, 10), 10)
    return `${d} ${MONTH_NAMES[m] || v.slice(5, 7)}`
  }
  // Compact format: YYYYMMDD
  if (v.length === 8 && !v.includes('-') && !v.includes('/')) {
    const m = parseInt(v.slice(4, 6), 10) - 1
    const d = parseInt(v.slice(6, 8), 10)
    return `${d} ${MONTH_NAMES[m] || v.slice(4, 6)}`
  }
  // Slash format: MM/DD
  if (v.length === 5 && v[2] === '/') {
    const m = parseInt(v.slice(0, 2), 10) - 1
    const d = parseInt(v.slice(3, 5), 10)
    return `${d} ${MONTH_NAMES[m] || v.slice(0, 2)}`
  }
  return v
}

export const formatTooltipDate = (v: any): string => {
  if (typeof v !== 'string') return typeof v === 'number' ? String(v) : ''
  if (v.length === 10 && v[4] === '-' && v[7] === '-') {
    const y = v.slice(0, 4)
    const m = parseInt(v.slice(5, 7), 10) - 1
    const d = parseInt(v.slice(8, 10), 10)
    return `${d} ${MONTH_NAMES[m] || v.slice(5, 7)} ${y}`
  }
  if (v.length === 8 && !v.includes('-') && !v.includes('/')) {
    const y = v.slice(0, 4)
    const m = parseInt(v.slice(4, 6), 10) - 1
    const d = parseInt(v.slice(6, 8), 10)
    return `${d} ${MONTH_NAMES[m] || v.slice(4, 6)} ${y}`
  }
  return v
}

export const GLOBAL_CSS = `
@keyframes ga-spin   { to { transform: rotate(360deg); } }
@keyframes ga-pulse  { 0%,100%{box-shadow:0 0 0 3px rgba(62,207,142,.3)} 50%{box-shadow:0 0 0 7px rgba(62,207,142,.08)} }
@keyframes ga-fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
@keyframes ga-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
.ga-skel {
  background:linear-gradient(90deg,#f1f5f9 25%,#e8eef4 50%,#f1f5f9 75%);
  background-size:1200px 100%; animation:ga-shimmer 1.4s infinite linear; border-radius:4px;
}
.ga-tooltip-wrap { position:relative; display:inline-flex; align-items:center; }
.ga-tooltip-wrap .ga-tip {
  visibility:hidden; opacity:0; pointer-events:none;
  position:absolute; bottom:calc(100% + 6px); right:-6px;
  background:#1e293b; color:#f1f5f9; font-size:12px; line-height:1.5;
  padding:8px 12px; border-radius:7px; white-space:normal; width:220px;
  max-width:calc(100vw - 32px);
  box-shadow:0 4px 16px rgba(0,0,0,.18); z-index:9999; transition:opacity .15s;
}
.ga-tooltip-wrap .ga-tip::after {
  content:''; position:absolute; top:100%; right:10px;
  border:5px solid transparent; border-top-color:#1e293b;
}
.ga-tooltip-wrap:hover .ga-tip { visibility:visible; opacity:1; }
.ga-info-btn {
  width:16px; height:16px; border-radius:50%; border:1.5px solid #94a3b8;
  background:transparent; color:#94a3b8; font-size:10px; font-weight:700;
  cursor:default; display:inline-flex; align-items:center; justify-content:center;
  margin-left:6px; flex-shrink:0; line-height:1; padding:0;
}
.ga-info-btn:hover { border-color:#4f8ef7; color:#4f8ef7; }
.ga-tab-btn { border:none; background:none; cursor:pointer; width:100%; padding:0; }
.ga-tab-btn:focus { outline:none; }
.ga-date-btn { border:none; cursor:pointer; }
.ga-retry-btn { border:none; cursor:pointer; }
`
