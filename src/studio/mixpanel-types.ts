export type DateRange = "7" | "14" | "30" | "90";

export interface MixpanelPluginConfig {
  /** URL of the /api/mixpanel proxy in your Next.js app. Defaults to /api/mixpanel */
  apiUrl?: string;
  /** Disable the plugin entirely. Useful for showing the dashboard in specific environments only. Defaults to false */
  disabled?: boolean;
}

export interface OverviewMetrics {
  totalEvents: number;
  uniqueUsers: number;
  avgEventsPerUser: number;
  topEvent: string;
  topEventCount: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  displayDate: string;
  events: number;
  uniqueUsers: number;
}

export interface EventData {
  name: string;
  count: number;
  uniqueUsers: number;
  percentage: number;
}

export interface EventPropertyRow {
  propertyKey: string;
  propertyValue: string;
  count: number;
}

export interface EventByHour {
  hour: string;
  label: string;
  count: number;
}

export interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  count: number;
  percentage: number;
}

export interface OsData {
  os: string;
  count: number;
  percentage: number;
}

export interface CityData {
  city: string;
  country: string;
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
}

export interface ConditionEventData {
  conditionName: string;
  conditionId: string;
  events: number;
  uniqueUsers: number;
}

export interface ProductEventData {
  productName: string;
  productId: string;
  events: number;
  uniqueUsers: number;
}

export interface FunnelStepData {
  step: string;
  count: number;
  conversionRate: number;
  dropOff: number;
}

export interface UserPropertyData {
  propertyName: string;
  propertyValue: string;
  count: number;
}

export interface MixpanelAnalyticsData {
  overview: OverviewMetrics;
  timeSeries: TimeSeriesDataPoint[];
  hourlyToday: EventByHour[];
  topEvents: EventData[];
  eventsByCategory: {
    branch: EventData[];
    condition: EventData[];
    product: EventData[];
    eligibility: EventData[];
    questionnaire: EventData[];
    cart: EventData[];
    checkout: EventData[];
  };
  devices: DeviceData[];
  browsers: BrowserData[];
  operatingSystems: OsData[];
  cities: CityData[];
  countries: CountryData[];
  conditionEvents: ConditionEventData[];
  productEvents: ProductEventData[];
  userProperties: UserPropertyData[];
  funnel?: FunnelStepData[];
  upgradeMessage?: string;
}

// Event categories mapping
export const EVENT_CATEGORIES: Record<string, string> = {
  // Branch events
  branch_assigned: "branch",
  branch_changed: "branch",

  // Condition events
  condition_viewed: "condition",
  condition_selected: "condition",
  condition_searched: "condition",

  // Product events
  product_viewed: "product",
  product_selected: "product",

  // Eligibility events
  eligibility_checked: "eligibility",
  recheck_eligibility_clicked: "eligibility",
  start_assessment_clicked: "eligibility",

  // Questionnaire events
  pds_check_records_clicked: "questionnaire",
  pds_check_submitted: "questionnaire",
  pds_check_result: "questionnaire",
  pds_enter_new_contact_toggled: "questionnaire",
  pds_continue_private_toggled: "questionnaire",
  pds_try_again_clicked: "questionnaire",
  new_contact_details_submitted: "questionnaire",
  signup_result: "questionnaire",
  questionnaire_flow_step: "questionnaire",
  flow_abandoned: "questionnaire",

  // Cart events
  request_treatment_clicked: "cart",
  otc_add_to_cart: "cart",
  cart_item_removed: "cart",
  cart_quantity_changed: "cart",
  cart_viewed: "cart",

  // Checkout events
  proceed_to_checkout: "checkout",
  discount_code_applied: "checkout",
  checkout_auth_shown: "checkout",
  drug_option_selected: "checkout",
  pay_now_clicked: "checkout",
  order_created: "checkout",
  order_success: "checkout",
};

// Key funnel events
export const FUNNEL_EVENTS = [
  "condition_selected",
  "eligibility_checked",
  "start_assessment_clicked",
  "questionnaire_flow_step",
  "request_treatment_clicked",
  "cart_viewed",
  "proceed_to_checkout",
  "pay_now_clicked",
  "order_success",
];
