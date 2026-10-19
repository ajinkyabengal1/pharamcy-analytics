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

import { definePlugin } from 'sanity'
import { SearchIcon } from '@sanity/icons'

import {
  SearchConsoleDashboard,
  SearchConsoleTool,
  ScOverviewTab,
  ScQueriesTab,
  ScPagesTab,
  ScCountriesTab,
  ScDevicesTab,
  ScAppearanceTab,
  ScSitemapsTab,
  OverviewTab,
  QueriesTab,
  PagesTab,
  CountriesTab,
  DevicesTab,
  AppearanceTab,
  SitemapsTab,
  type ScTab,
  type SearchConsoleTab,
} from './search-console/search-console-dashboard'

import type { SearchConsolePluginConfig } from './search-console/search-console-types'

export {
  SearchConsoleDashboard,
  SearchConsoleTool,
  ScOverviewTab,
  ScQueriesTab,
  ScPagesTab,
  ScCountriesTab,
  ScDevicesTab,
  ScAppearanceTab,
  ScSitemapsTab,
  OverviewTab,
  QueriesTab,
  PagesTab,
  CountriesTab,
  DevicesTab,
  AppearanceTab,
  SitemapsTab,
  type ScTab,
  type SearchConsoleTab,
  type SearchConsolePluginConfig,
}

export {
  DashboardShell,
  DASHBOARD_CSS,
  SC_ACCENT,
  GA_ACCENT,
  MetricCard,
  MetricGrid,
  DataTable,
  Donut,
  HorizontalBar,
  PathCell,
  StatusPill,
  ErrorState,
  InitialLoading,
  SkeletonChart,
  Panel,
} from './search-console/dashboard-ui'

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
  mixpanelApiUrl?: string
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
              mixpanelApiUrl={config.mixpanelApiUrl}
              brandName={toolTitle}
            />
          )
        },
      },
    ],
  }
}

/**
 * Standalone Search Console Sanity Studio plugin (1:1 identical to Strachans Pharmacy).
 *
 * Usage in sanity.config.ts:
 * ```ts
 * import { searchConsolePlugin } from '@healthya-team/pharmacy-analytics/studio'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [
 *     searchConsolePlugin({
 *       apiUrl: '/api/search-console',
 *     }),
 *   ],
 * })
 * ```
 */
export const searchConsolePlugin = (
  config: SearchConsolePluginConfig = {},
) =>
  definePlugin({
    name: 'search-console',
    tools: (prev) => {
      if (config.disabled) return prev
      return [
        ...prev,
        {
          name: 'search-console',
          title: 'Search Console',
          icon: SearchIcon,
          component: () => <SearchConsoleTool apiUrl={config.apiUrl} />,
        },
      ]
    },
  })()

