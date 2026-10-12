import type {
  DateRange,
  MixpanelAnalyticsData,
  EventPropertyRow,
} from "./mixpanel-types";
import { EVENT_CATEGORIES } from "./mixpanel-types";

/**
 * Fetch Mixpanel analytics data from the Next.js API proxy
 */
export async function fetchMixpanelData(
  apiUrl: string,
  dateRange: DateRange
): Promise<MixpanelAnalyticsData> {
  const url = `${apiUrl}?dateRange=${dateRange}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mixpanel API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Categorize events
  const eventsByCategory = categorizeEvents(data.topEvents || []);

  return {
    ...data,
    eventsByCategory,
  };
}

/**
 * Categorize events by business context
 */
function categorizeEvents(events: any[]) {
  const categories: Record<string, any[]> = {
    branch: [],
    condition: [],
    product: [],
    eligibility: [],
    questionnaire: [],
    cart: [],
    checkout: [],
  };

  events.forEach((event) => {
    const category = EVENT_CATEGORIES[event.name];
    if (category && categories[category]) {
      categories[category].push(event);
    }
  });

  return categories;
}

/**
 * Fetch event properties for a specific event
 */
export async function fetchEventProperties(
  apiUrl: string,
  eventName: string,
  dateRange: DateRange
): Promise<EventPropertyRow[]> {
  const url = `${apiUrl}?mode=event-properties&event=${encodeURIComponent(
    eventName
  )}&dateRange=${dateRange}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Mixpanel Event Properties API error ${res.status}: ${text}`
    );
  }

  const data = await res.json();
  return data.rows || [];
}

/* ─── Funnel Helpers ───────────────────────────────────────────────────── */

export interface FunnelEventsResponse {
  eventCounts: Record<string, number>;
  qfsSteps: { step: string; count: number }[];
  qfsStepsByFlow: Record<string, { step: string; count: number }[]>;
  paramBreakdowns: Record<string, Record<string, Record<string, number>>>;
  qfsStepBreakdowns: Record<string, Record<string, Record<string, number>>>;
}

/**
 * Fetch unique branch_corporate_id values that appear in funnel events
 */
export async function fetchFunnelBranches(
  apiUrl: string,
  dateRange: DateRange
): Promise<string[]> {
  const url = `${apiUrl}?mode=funnel-branches&dateRange=${dateRange}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Funnel branches API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Fetch unique condition_name values for the funnel condition dropdown,
 * optionally filtered to a specific branch
 */
export async function fetchFunnelConditions(
  apiUrl: string,
  dateRange: DateRange,
  branch?: string,
  isPreConsult?: boolean,
  signal?: AbortSignal,
): Promise<{ name: string; id: number | null }[]> {
  let url = `${apiUrl}?mode=funnel-conditions&dateRange=${dateRange}`;
  if (branch) url += `&branch=${encodeURIComponent(branch)}`;
  if (isPreConsult) url += `&preConsult=true`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Funnel conditions API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Fetch funnel event counts + param breakdowns for a selected condition,
 * optionally filtered to a specific branch
 */
export async function fetchFunnelEvents(
  apiUrl: string,
  dateRange: DateRange,
  condition: string,
  branch?: string,
  signal?: AbortSignal,
): Promise<FunnelEventsResponse> {
  let url = `${apiUrl}?mode=funnel-events&dateRange=${dateRange}&condition=${encodeURIComponent(condition)}`;
  if (branch) url += `&branch=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Funnel events API error ${res.status}: ${text}`);
  }
  return res.json();
}

/* ─── Sign-up Patient Records ─────────────────────────────────────────── */

export interface SignupPatientRecord {
  distinct_id: string;
  timestamp: number;
  condition_name: string;
  branch_corporate_id: string;
  user_journey_flow: string;
  first_name: string;
  last_name: string;
  postcode: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone: string;
  signup_status: string;
  pds_matched: string;
}

/**
 * Fetch individual patient records for sign_up_form_submission events
 */
export async function fetchSignupPatients(
  apiUrl: string,
  dateRange: DateRange,
  condition: string,
  branch?: string,
  signal?: AbortSignal,
): Promise<SignupPatientRecord[]> {
  let url = `${apiUrl}?mode=funnel-signup-patients&dateRange=${dateRange}&condition=${encodeURIComponent(condition)}`;
  if (branch) url += `&branch=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Signup patients API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.patients || [];
}

/* ─── PM Cart Auth Patient Records ───────────────────────────────────── */

export interface CartAuthPatientRecord {
  distinct_id: string;
  timestamp: number;
  user_name: string;
  user_email: string;
  user_gender: string;
  user_phone: string;
  product_name: string;
  condition_name: string;
  pm_flow_source: string;
}

export async function fetchCartAuthPatients(
  apiUrl: string,
  dateRange: DateRange,
  opts: {
    flowSource: "product_detail" | "condition_detail";
    product: string;
    conditionId?: number;
  },
  signal?: AbortSignal,
): Promise<CartAuthPatientRecord[]> {
  let url = `${apiUrl}?mode=pm-funnel-cart-auth-patients&dateRange=${dateRange}&flowSource=${opts.flowSource}&product=${encodeURIComponent(opts.product)}`;
  if (opts.conditionId != null) url += `&conditionId=${opts.conditionId}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cart auth patients API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.patients || [];
}

export async function fetchAuthPatients(
  apiUrl: string,
  dateRange: DateRange,
  opts: {
    flowSource: "product_detail" | "condition_detail";
    product?: string;
    conditionId?: number;
  },
  signal?: AbortSignal,
): Promise<CartAuthPatientRecord[]> {
  let url = `${apiUrl}?mode=pm-funnel-auth-patients&dateRange=${dateRange}&flowSource=${opts.flowSource}`;
  if (opts.product) url += `&product=${encodeURIComponent(opts.product)}`;
  if (opts.conditionId != null) url += `&conditionId=${opts.conditionId}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth patients API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.patients || [];
}

/* ─── PM Funnel Helpers ───────────────────────────────────────────────── */

export interface PmFunnelEventsResponse {
  eventCounts: Record<string, number>;
  paramBreakdowns: Record<string, Record<string, Record<string, number>>>;
}

/**
 * Fetch unique product_name (product_detail flow) or condition_name (condition_detail flow) values
 */
export async function fetchPmFunnelProducts(
  apiUrl: string,
  dateRange: DateRange,
  flowSource?: string,
  signal?: AbortSignal,
): Promise<{ name: string; id: number | null }[]> {
  let url = `${apiUrl}?mode=pm-funnel-conditions&dateRange=${dateRange}`;
  if (flowSource) url += `&flow_source=${encodeURIComponent(flowSource)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PM Funnel products API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Fetch PM flow event counts + param breakdowns.
 * Both flows filter by product name. Condition detail uses distinct_id join
 * on the server to match auth/questionnaire events that predate product selection.
 */
export async function fetchPmFunnelEvents(
  apiUrl: string,
  dateRange: DateRange,
  filterValue: string,
  flowSource?: string,
  signal?: AbortSignal,
): Promise<PmFunnelEventsResponse> {
  let url = `${apiUrl}?mode=pm-funnel-events&dateRange=${dateRange}&product=${encodeURIComponent(filterValue)}`;
  if (flowSource) url += `&flow_source=${encodeURIComponent(flowSource)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PM Funnel events API error ${res.status}: ${text}`);
  }
  return res.json();
}

/* ─── PM Funnel — Condition Detail Flow ──────────────────────────────── */

export interface PmConditionEventsResponse {
  eventCounts: { pm_start_assessment_clicked: number; auth_completed: number; questionnaire_pm: number };
  paramBreakdowns: { auth_completed: { method: Record<string, number> } };
  products: Array<{ name: string; id: number | null; count: number }>;
}

export interface PmProductCartResponse {
  eventCounts: Record<string, number>;
  paramBreakdowns: Record<string, Record<string, Record<string, number>>>;
}

export async function fetchPmConditionOptions(
  apiUrl: string,
  dateRange: DateRange,
  signal?: AbortSignal,
): Promise<number[]> {
  const url = `${apiUrl}?mode=pm-funnel-condition-options&dateRange=${dateRange}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PM condition options API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.ids || [];
}

export async function fetchPmConditionEvents(
  apiUrl: string,
  dateRange: DateRange,
  conditionId: number,
  signal?: AbortSignal,
): Promise<PmConditionEventsResponse> {
  const url = `${apiUrl}?mode=pm-funnel-condition-events&dateRange=${dateRange}&conditionId=${conditionId}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PM condition events API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchPmProductCart(
  apiUrl: string,
  dateRange: DateRange,
  conditionId: number,
  product: string,
  signal?: AbortSignal,
): Promise<PmProductCartResponse> {
  const url = `${apiUrl}?mode=pm-funnel-product-cart&dateRange=${dateRange}&conditionId=${conditionId}&product=${encodeURIComponent(product)}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PM product cart API error ${res.status}: ${text}`);
  }
  return res.json();
}

/* ──────────────────────────────────────────────────────────────────────── */

export interface ConditionStat {
  name: string
  total: number
  condition_viewed: number
  eligibility_checked: number
  start_assessment_clicked: number
  questionnaire_flow_step: number
}

export interface ProductStat {
  name: string
  total: number
  product_viewed: number
  get_treatment_clicked: number
  product_selected: number
  questionnaire_pm: number
  cart_viewed: number
  cart_auth_completed: number
  checkout_started: number
  order_success: number
}

export interface ServiceBreakdown {
  nhs: number
  private_service: number
  private_medication: number
}

export interface TopEntitiesResponse {
  conditions: ConditionStat[]
  products: ProductStat[]
  serviceBreakdown: ServiceBreakdown
  productCategoryBreakdown: Record<string, number>
}

/**
 * Fetch top conditions & products with per-event counts from Mixpanel.
 * Optionally narrow results to a specific condition or product name.
 */
export async function fetchTopEntities(
  apiUrl: string,
  dateRange: DateRange,
  opts?: {condition?: string; product?: string},
  signal?: AbortSignal,
): Promise<TopEntitiesResponse> {
  let url = `${apiUrl}?mode=top-entities&dateRange=${dateRange}`
  if (opts?.condition) url += `&condition=${encodeURIComponent(opts.condition)}`
  if (opts?.product) url += `&product=${encodeURIComponent(opts.product)}`
  const res = await fetch(url, {cache: 'no-store', signal})
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(
      (err as {error?: string})?.error ||
        `Top entities API error: ${res.status} ${res.statusText}`,
    )
  }
  const json = await res.json()
  return {
    conditions: (json.conditions ?? []) as ConditionStat[],
    products: (json.products ?? []) as ProductStat[],
    serviceBreakdown: (json.serviceBreakdown ?? {nhs: 0, private_service: 0, private_medication: 0}) as ServiceBreakdown,
    productCategoryBreakdown: (json.productCategoryBreakdown ?? {}) as Record<string, number>,
  }
}

export interface TopSearchesResponse {
  topSearches: Array<{ term: string; count: number }>
}

/**
 * Fetch top searched terms (condition or product) from Mixpanel.
 */
export async function fetchTopSearches(
  apiUrl: string,
  dateRange: DateRange,
  type: 'condition' | 'product',
  signal?: AbortSignal,
): Promise<TopSearchesResponse> {
  const url = `${apiUrl}?mode=top-searches&dateRange=${dateRange}&type=${type}`
  const res = await fetch(url, { cache: 'no-store', signal })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(
      (err as { error?: string })?.error ||
        `Top searches API error: ${res.status} ${res.statusText}`,
    )
  }
  const json = await res.json()
  return { topSearches: (json.topSearches ?? []) as Array<{ term: string; count: number }> }
}

/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Clear the server-side Mixpanel API cache
 */
export async function clearMixpanelCache(apiUrl: string): Promise<void> {
  const res = await fetch(`${apiUrl}?mode=clear-cache`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clear cache error ${res.status}: ${text}`);
  }
}
