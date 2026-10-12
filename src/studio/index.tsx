import React from 'react'
import { BarChart3 } from 'lucide-react'
import {
  UnifiedDashboard,
  type UnifiedDashboardProps,
  type MainSection,
  type UnifiedTabId,
} from './components/UnifiedDashboard'

export { UnifiedDashboard, type UnifiedDashboardProps, type MainSection, type UnifiedTabId }
export { UnifiedDashboard as PharmacyAnalyticsDashboard }

// Re-export Search Console component and tabs
export {
  SearchConsoleDashboard,
  ScOverviewTab,
  ScQueriesTab,
  ScPagesTab,
  ScCountriesTab,
  ScDevicesTab,
  ScAppearanceTab,
  ScSitemapsTab,
} from './search-console/search-console-dashboard'

// Explicitly re-export GA types & Search Console types
export type {
  AnalyticsData,
  OverviewMetrics,
  TimeSeriesDataPoint,
  HourlyDataPoint,
  TopPage,
  LandingPage,
  DeviceCategory,
  BrowserData,
  OsData,
  CountryData,
  CityData,
  TrafficSource,
  ChannelData,
  UserTypeData,
  EventData,
  ReferrerData,
  EventParamRow,
  DateRange,
} from './ga-types'

export type {
  SearchConsoleData,
  ScRow,
  ScQuery,
  ScPage,
  ScTimeSeriesPoint,
  ScCountry,
  ScDevice,
  ScSearchAppearance,
  Sitemap,
  SitemapContent,
  ScDateRange,
} from './search-console/search-console-types'

export interface PharmacyAnalyticsPluginConfig {
  apiUrl?: string
  scApiUrl?: string
  title?: string
  name?: string
  icon?: React.ComponentType
}

/**
 * Sanity Studio plugin that registers the Unified Pharmacy Analytics tool.
 *
 * Usage in sanity.config.ts:
 * ```ts
 * import { pharmacyAnalyticsPlugin } from '@healthya-team/pharmacy-analytics/studio'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [
 *     pharmacyAnalyticsPlugin({
 *       apiUrl: '/api/analytics',
 *     }),
 *   ],
 * })
 * ```
 */
export function pharmacyAnalyticsPlugin(config: PharmacyAnalyticsPluginConfig = {}) {
  const toolName = config.name || 'pharmacy-analytics'
  const toolTitle = config.title || 'Analytics'
  const ToolIcon = config.icon || BarChart3

  return {
    name: toolName,
    tools: [
      {
        name: toolName,
        title: toolTitle,
        icon: ToolIcon,
        component: function PharmacyAnalyticsToolComponent() {
          return (
            <UnifiedDashboard
              apiUrl={config.apiUrl || '/api/analytics'}
              scApiUrl={config.scApiUrl}
              brandName={toolTitle}
            />
          )
        },
      },
    ],
  }
}
