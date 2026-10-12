import mixpanel from 'mixpanel-browser'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

/**
 * Fires an analytics event to GA4 (via gtag) and Mixpanel in parallel.
 * No-ops server-side. GA4 is skipped when gtag is unavailable (e.g. consent denied).
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    console.log(`📊 trackEvent("${eventName}") called but window is undefined`)
    return
  } 

  if (typeof window.gtag !== 'function') {
    console.warn(`⚠️ trackEvent("${eventName}") called but gtag is not available. Consent might be denied.`)
  } else {
    console.log(`✅ Firing GA4 event: "${eventName}"`, params)
    window.gtag('event', eventName, params)
  }

  try {
    mixpanel.track(eventName, params)
    // console.log(`✅ Firing Mixpanel event: "${eventName}"`, params)
  } catch (err) {
    console.warn(`⚠️ Mixpanel track failed for "${eventName}":`, err)
  }
}

// ─── Page View ────────────────────────────────────────────────────────────────

export function trackPageView(pagePath: string, pageTitle: string): void {
  trackEvent('page_view', { page_path: pagePath, page_title: pageTitle })
}


// ─── Condition Analytics ──────────────────────────────────────────────────────

export interface ConditionTrackingParams {
  condition_slug: string
  condition_name: string
  condition_id: string | number
  branch_corporate_id?: string | number
  source?: string,
  is_pre_consult: boolean
  is_private_medication: boolean
}

export function trackConditionViewed(params: ConditionTrackingParams): void {
  trackEvent('condition_viewed', params as unknown as Record<string, unknown>)
}

export interface StartAssessmentClickedParams {
  eligibility_status: 'passed' | 'failed'
  is_nhs: boolean
  gender: string
  date_of_birth: string
  condition_id: string | number
  condition_name: string
  branch_corporate_id?: string | number
}

export function trackStartAssessmentClicked(params: StartAssessmentClickedParams): void {
  trackEvent('start_assessment_clicked', params as unknown as Record<string, unknown>)
}

// ─── Eligibility Check Analytics ─────────────────────────────────────────────

export interface EligibilityCheckedParams {
  status: 'passed' | 'failed'
  gender: string
  date_of_birth: string
  condition_name: string,
  condition_id: string | number
  branch_corporate_id?: string | number
}

export function trackEligibilityChecked(params: EligibilityCheckedParams): void {
  trackEvent('eligibility_checked', params as unknown as Record<string, unknown>)
}

export interface QuestionnaireFlowStepParams {
  step: string
  condition_token: string
  condition_id: string | number
  condition_name: string
  user_journey_flow: string
  branch_corporate_id?: string | number
}

export function trackQuestionnaireFlowStep(params: QuestionnaireFlowStepParams): void {
  trackEvent('questionnaire_flow_step', params as unknown as Record<string, unknown>)
}



// ─── Product Analytics ──────────────────────────────────────────────────────

export interface ProductTrackingParams {
  product_slug: string
  product_name: string
  product_id: string | number
  core_drug_id?: number
  branch_corporate_id?: string | number
  condition_id?: string | number
  condition_name?: string
  source?: string
  category_type?: string
}

export function trackProductViewed(params: ProductTrackingParams): void {
  trackEvent('product_viewed', params as unknown as Record<string, unknown>)
}


export interface GetTreatmentClickedParams {
  product_slug: string
  product_name: string
  category_type?: string
  product_id: string | number
  core_drug_id?: number
  branch_corporate_id?: string | number
  condition_id?: string | number
  condition_name?: string
  pm_flow_source?: 'product_detail' | 'condition_detail'
  button_origin?: string
}

export function trackGetTreatmentClicked(params: GetTreatmentClickedParams): void {
  trackEvent('get_treatment_clicked', params as unknown as Record<string, unknown>)
}



export interface PMStartAssessmentClickedParams {
  branch_corporate_id?: string | number
  condition_id?: string | number
  condition_name?: string
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackPMStartAssessmentClicked(params: PMStartAssessmentClickedParams): void {
  trackEvent('pm_start_assessment_clicked', params as unknown as Record<string, unknown>)
}

// ─── PM Flow Analytics ────────────────────────────────────────────────────────

export interface AuthCompletedParams {
  method: 'signup' | 'signin' | 'guest' | 'already_logged_in'
  branch_corporate_id?: string | number
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  formulary?: string
  product_name?: string
  user_name?: string
  user_email?: string
  user_gender?: string
  user_phone?: string
  user_dob?: string
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackAuthCompleted(params: AuthCompletedParams): void {
  trackEvent('auth_completed', params as unknown as Record<string, unknown>)
}


export interface QuestionnairePmParams {
  product_id?: string | number
  product_slug?: string
  product_name?: string
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  branch_corporate_id?: string | number
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackQuestionnairePm(params: QuestionnairePmParams): void {
  trackEvent('questionnaire_pm', params as unknown as Record<string, unknown>)
}


export interface CartViewedParams {
  product_id?: string | number
  product_slug?: string
  product_name?: string
  branch_corporate_id?: string | number
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  cart_item_count?: number
  cart_total_price?: number
  pm_flow_source?: 'product_detail' | 'condition_detail'
  /** 'signed_in' when user is authenticated, 'guest' when browsing as a guest */
  cart_auth_status?: 'signed_in' | 'guest'
}

export function trackCartViewed(params: CartViewedParams): void {
  trackEvent('cart_viewed', params as unknown as Record<string, unknown>)
}



export interface CheckoutStartedParams {
  product_id?: string | number
  product_slug?: string
  product_name?: string
  branch_corporate_id?: string | number
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  cart_item_count?: number
  cart_total_price?: number
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackCheckoutStarted(params: CheckoutStartedParams): void {
  trackEvent('checkout_started', params as unknown as Record<string, unknown>)
}




export interface OrderSuccessParams {
  product_id?: string | number
  product_slug?: string
  product_name?: string
  branch_corporate_id?: string | number
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  // dose?: number
  // dose_unit?: string
  // dose_packet_id?: number
  // packet_size?: number
  // formulary?: string
  order_id?: string | number
  cart_item_count?: number
  cart_total_price?: number
  payment_mode?: string
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackOrderSuccess(params: OrderSuccessParams): void {
  trackEvent('order_success', params as unknown as Record<string, unknown>)
}

export interface CartAuthCompletedParams {
  method: 'signup' | 'signin' | 'guest'
  product_id?: string | number
  product_slug?: string
  product_name?: string
  branch_corporate_id?: string | number
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  user_name?: string
  user_email?: string
  user_gender?: string
  user_phone?: string
  user_dob?: string
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackCartAuthCompleted(params: CartAuthCompletedParams): void {
  trackEvent('cart_auth_completed', params as unknown as Record<string, unknown>)
}


export interface ProductSelectedParams {
  product_id?: string | number
  product_slug?: string
  product_name?: string
  core_drug_id?: number
  condition_id?: string | number
  condition_name?: string
  branch_corporate_id?: string | number
  pm_flow_source?: 'product_detail' | 'condition_detail'
}

export function trackProductSelected(params: ProductSelectedParams): void {
  trackEvent('product_selected', params as unknown as Record<string, unknown>)
}


// ─── Search Analytics ──────────────────────────────────────────────────────

export interface ConditionSearchedParams {
  search_term: string
  results_count: number
  source: 'hero' | 'nav' | 'mobile_nav' | 'page'
}

export function trackConditionSearched(params: ConditionSearchedParams): void {
  trackEvent('condition_searched', params as unknown as Record<string, unknown>)
}

export interface ProductSearchedParams {
  search_term: string
  results_count: number
}

export function trackProductSearched(params: ProductSearchedParams): void {
  trackEvent('product_searched', params as unknown as Record<string, unknown>)
}

