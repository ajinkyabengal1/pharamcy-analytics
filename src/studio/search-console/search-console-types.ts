export type ScDateRange = "7" | "28" | "90" | "180";

export interface ScRow {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface ScQuery extends ScRow {
  query: string;
}

export interface ScPage extends ScRow {
  page: string;
}

export interface ScTimeSeriesPoint extends ScRow {
  date: string;
}

export interface ScCountry extends ScRow {
  country: string;
  countryCode: string;
}

export interface ScDevice extends ScRow {
  device: string;
}

export interface ScSearchAppearance extends ScRow {
  appearance: string;
}

export interface SitemapContent {
  type: string;
  submitted: number;
  indexed: number;
}

export interface Sitemap {
  path: string;
  lastSubmitted: string;
  lastDownloaded: string;
  isPending: boolean;
  warnings: number;
  errors: number;
  contents: SitemapContent[];
}

export interface SearchConsoleData {
  overview: ScRow;
  queries: ScQuery[];
  pages: ScPage[];
  timeSeries: ScTimeSeriesPoint[];
  countries: ScCountry[];
  devices: ScDevice[];
  searchAppearance: ScSearchAppearance[];
  sitemaps: Sitemap[];
}

export interface SearchConsolePluginConfig {
  /** URL of the /api/search-console proxy in your Next.js app. Defaults to /api/search-console */
  apiUrl?: string;
  /** Disable the plugin entirely. Useful for showing the dashboard in specific environments only. Defaults to false */
  disabled?: boolean;
}
