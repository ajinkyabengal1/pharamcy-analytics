import {useCallback, useEffect, useState} from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  FileText,
  Globe2,
  Map,
  Search,
  Smartphone,
  Sparkles,
  Target,
} from 'lucide-react'
import type {ScDateRange, SearchConsoleData} from './search-console-types'
import {fetchSearchConsoleData} from './sc-api'
import {formatDateTick, formatTooltipDate, evenTickInterval} from '../components/ga-constants'
import {
  CHART_GRID,
  CHART_TICK,
  DashboardShell,
  type DashboardTab,
  DataTable,
  Donut,
  ErrorState,
  HorizontalBar,
  InitialLoading,
  MetricCard,
  MetricGrid,
  Panel,
  PathCell,
  SC_ACCENT,
  SectionLabel,
  SkeletonChart,
  StatusPill,
  chartTooltipStyle,
} from './dashboard-ui'

const DATE_RANGES: {label: string; value: ScDateRange}[] = [
  {label: '7d', value: '7'},
  {label: '28d', value: '28'},
  {label: '3mo', value: '90'},
  {label: '6mo', value: '180'},
]

const DEVICE_COLORS: Record<string, string> = {
  DESKTOP: '#6366f1',
  desktop: '#6366f1',
  MOBILE: '#0f9f6e',
  mobile: '#0f9f6e',
  TABLET: '#f59e0b',
  tablet: '#f59e0b',
}

const METRIC_INFO: Record<string, string> = {
  'Total Clicks': 'Total number of times users clicked through to your site from Google Search results.',
  'Total Impressions': 'How many times your site appeared in search results, whether clicked or not.',
  'Average CTR': 'Click-through rate - percentage of impressions that resulted in a click.',
  'Avg. Position': 'Average ranking position in search results. Lower is better.',
}

const SECTION_INFO: Record<string, string> = {
  'Clicks & Impressions Over Time': 'Daily trend of clicks and impressions from Google Search over the selected date range.',
  'Top Queries': 'The search terms that show your site most often in Google results.',
  'Top Pages': 'Your pages that appear most frequently in Google Search results.',
  Countries: 'Countries where your site appears in Google Search, ranked by clicks.',
  Devices: 'How your search traffic is distributed across desktop, mobile, and tablet.',
  'Search Appearance': 'How your results appear in Google Search.',
  'Sitemaps & Indexing': 'Manage submitted sitemaps and see how many URLs Google has indexed.',
}

const SEARCH_APPEARANCE_LABELS: Record<string, string> = {
  AMP_BLUE_LINK: 'AMP Blue Link',
  AMP_TOP_STORIES: 'AMP Top Stories',
  RICHTEXT: 'Rich Text',
  RICH_RESULT: 'Rich Result',
  WEB_LIGHT: 'Web Light',
  WEB_STORY: 'Web Story',
  EVENT_LISTING: 'Event Listing',
  EVENT_DETAILS: 'Event Details',
  SEARCH_RESULT: 'Search Result',
  FAQ_RICH_RESULT: 'FAQ Rich Result',
  HOWTO_RICH_RESULT: 'How-to Rich Result',
  SPECIAL_ANNOUNCEMENT: 'Special Announcement',
  BREADCRUMB: 'Breadcrumb',
  PRODUCT_RESULT: 'Product Result',
  MERCHANT_LISTINGS: 'Merchant Listings',
  JOB_LISTING: 'Job Listing',
  JOB_DETAILS: 'Job Details',
  EDUCATION_Q_A: 'Education Q&A',
  PRACTICE_PROBLEMS: 'Practice Problems',
  MATH_SOLVERS: 'Math Solvers',
  TRANSLATED_RESULT: 'Translated Result',
  VIDEO: 'Video',
  IMAGE: 'Image',
  ORGANIC_SHOPPING: 'Organic Shopping',
  REVIEW_SNIPPET: 'Review Snippet',
}

function formatAppearance(raw: string) {
  return SEARCH_APPEARANCE_LABELS[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

type Tab = 'overview' | 'queries' | 'pages' | 'countries' | 'devices' | 'appearance' | 'sitemaps'

const TABS: DashboardTab<Tab>[] = [
  {id: 'overview', label: 'Overview', icon: <BarChart3 size={16} />},
  {id: 'queries', label: 'Queries', icon: <Search size={16} />},
  {id: 'pages', label: 'Pages', icon: <FileText size={16} />},
  {id: 'countries', label: 'Countries', icon: <Globe2 size={16} />},
  {id: 'devices', label: 'Devices', icon: <Smartphone size={16} />},
  {id: 'appearance', label: 'Appearance', icon: <Sparkles size={16} />},
  {id: 'sitemaps', label: 'Sitemaps', icon: <Map size={16} />},
]

const fNum = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n))
const fCtr = (n: number) => `${(n * 100).toFixed(1)}%`
const fPos = (n: number) => n.toFixed(1)
const fPctOf = (n: number, total: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%'

const chartAxis = {
  fontSize: 11,
  tick: {fill: CHART_TICK},
  axisLine: false,
  tickLine: false,
}

export function ScOverviewTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const clicksSeries = data.timeSeries.map(row => ({
    date: row.date,
    displayDate: row.date.slice(5).replace('-', '/'),
    clicks: row.clicks,
    impressions: row.impressions,
  }))

  return (
    <div className="ad-fade">
      <SectionLabel>Key Metrics</SectionLabel>
      <MetricGrid style={{marginBottom: 22}}>
        {([
          ['Total Clicks', fNum(data.overview.clicks), '#0f9f6e'],
          ['Total Impressions', fNum(data.overview.impressions), '#6366f1'],
          ['Average CTR', fCtr(data.overview.ctr), '#f59e0b'],
          ['Avg. Position', fPos(data.overview.position), '#8b5cf6'],
        ] as [string, string, string][]).map(([label, value, color]) => (
          <MetricCard key={label} label={label} value={value} color={color} info={METRIC_INFO[label]} loading={loading} />
        ))}
      </MetricGrid>

      <Panel title="Clicks & Impressions Over Time" info={SECTION_INFO['Clicks & Impressions Over Time']}>
        {loading ? (
          <SkeletonChart height={306} />
        ) : (
          <div style={{height: 306}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clicksSeries} margin={{top: 8, right: 10, left: 0, bottom: 0}}>
                <defs>
                  {[
                    ['scClicks', '#0f9f6e'],
                    ['scImpressions', '#6366f1'],
                  ].map(([id, color]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={CHART_GRID} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  minTickGap={28}
                  interval={evenTickInterval(clicksSeries?.length ?? 0)}
                  padding={{left: 2, right: 15}}
                  {...chartAxis}
                />
                <YAxis {...chartAxis} width={38} />
                <Tooltip
                  labelFormatter={formatTooltipDate}
                  contentStyle={chartTooltipStyle}
                  cursor={{stroke: '#cbd5e1', strokeDasharray: '4 4'}}
                />
                <Legend wrapperStyle={{fontSize: 12, fontWeight: 700, paddingTop: 10}} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#0f9f6e" fill="url(#scClicks)" strokeWidth={2.4} dot={false} />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#6366f1" fill="url(#scImpressions)" strokeWidth={2.4} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginTop: 16}}>
        <Panel title="Top 5 Queries" info={SECTION_INFO['Top Queries']}>
          <DataTable
            loading={loading}
            headers={[
              {label: 'Query'},
              {label: 'Clicks', align: 'right', width: '76px'},
              {label: 'Impressions', align: 'right', width: '104px'},
              {label: 'CTR', align: 'right', width: '68px'},
            ]}
            rows={data.queries.slice(0, 5).map(query => [
              query.query,
              fNum(query.clicks),
              fNum(query.impressions),
              fCtr(query.ctr),
            ])}
          />
        </Panel>

        <Panel title="Top 5 Pages" info={SECTION_INFO['Top Pages']}>
          <DataTable
            loading={loading}
            headers={[
              {label: 'Page'},
              {label: 'Clicks', align: 'right', width: '76px'},
              {label: 'Position', align: 'right', width: '82px'},
            ]}
            rows={data.pages.slice(0, 5).map(page => [
              <PathCell key={page.page} path={page.page} />,
              fNum(page.clicks),
              fPos(page.position),
            ])}
          />
        </Panel>
      </div>
    </div>
  )
}

export function ScQueriesTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const maxClicks = data.queries[0]?.clicks ?? 1

  return (
    <div className="ad-fade">
      <Panel title="Top Queries" info={SECTION_INFO['Top Queries']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Query'},
            {label: 'Clicks', align: 'right', width: '76px'},
            {label: 'Impressions', align: 'right', width: '104px'},
            {label: 'CTR', align: 'right', width: '68px'},
            {label: 'Position', align: 'right', width: '82px'},
          ]}
          rows={data.queries.map(query => [
            <span key={query.query} style={{display: 'block', minWidth: 0}}>
              <span style={{display: 'block', color: '#172033', fontWeight: 750, overflowWrap: 'anywhere'}}>{query.query}</span>
              <HorizontalBar value={query.clicks} max={maxClicks} color="#0f9f6e" />
            </span>,
            fNum(query.clicks),
            fNum(query.impressions),
            fCtr(query.ctr),
            fPos(query.position),
          ])}
        />
      </Panel>
    </div>
  )
}

export function ScPagesTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const maxClicks = data.pages[0]?.clicks ?? 1

  return (
    <div className="ad-fade">
      <Panel title="Top Pages" info={SECTION_INFO['Top Pages']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Page'},
            {label: 'Clicks', align: 'right', width: '76px'},
            {label: 'Impressions', align: 'right', width: '104px'},
            {label: 'CTR', align: 'right', width: '68px'},
            {label: 'Position', align: 'right', width: '82px'},
          ]}
          rows={data.pages.map(page => [
            <span key={page.page} style={{display: 'block'}}>
              <PathCell path={page.page} />
              <HorizontalBar value={page.clicks} max={maxClicks} color="#6366f1" />
            </span>,
            fNum(page.clicks),
            fNum(page.impressions),
            fCtr(page.ctr),
            fPos(page.position),
          ])}
        />
      </Panel>
    </div>
  )
}

export function ScCountriesTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const maxClicks = data.countries[0]?.clicks ?? 1

  return (
    <div className="ad-fade">
      <Panel title="Performance by Country" info={SECTION_INFO['Countries']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Country'},
            {label: 'Clicks', align: 'right', width: '76px'},
            {label: 'Impressions', align: 'right', width: '104px'},
            {label: 'CTR', align: 'right', width: '68px'},
            {label: 'Position', align: 'right', width: '82px'},
          ]}
          rows={data.countries.map(country => [
            <span key={country.country} style={{display: 'block'}}>
              <span style={{color: '#172033', fontWeight: 750}}>{country.country}</span>
              <HorizontalBar value={country.clicks} max={maxClicks} color="#0f9f6e" />
            </span>,
            fNum(country.clicks),
            fNum(country.impressions),
            fCtr(country.ctr),
            fPos(country.position),
          ])}
        />
      </Panel>
    </div>
  )
}

export function ScDevicesTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const totalClicks = data.devices.reduce((sum, device) => sum + device.clicks, 0)

  return (
    <div className="ad-fade" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14}}>
      <Panel title="Device Distribution" info={SECTION_INFO['Devices']}>
        <Donut
          loading={loading}
          data={data.devices.map(device => ({
            name: device.device,
            value: device.clicks,
            percentage: totalClicks > 0 ? Math.round((device.clicks / totalClicks) * 1000) / 10 : 0,
          }))}
          colors={data.devices.map(device => DEVICE_COLORS[device.device] ?? '#6366f1')}
          formatter={fNum}
        />
      </Panel>

      <Panel title="Performance by Device">
        <DataTable
          loading={loading}
          headers={[
            {label: 'Device'},
            {label: 'Clicks', align: 'right', width: '76px'},
            {label: 'Share', align: 'right', width: '68px'},
            {label: 'CTR', align: 'right', width: '68px'},
            {label: 'Position', align: 'right', width: '82px'},
          ]}
          rows={data.devices.map(device => [
            <span key={device.device} style={{textTransform: 'capitalize'}}>{device.device.toLowerCase()}</span>,
            fNum(device.clicks),
            fPctOf(device.clicks, totalClicks),
            fCtr(device.ctr),
            fPos(device.position),
          ])}
        />
      </Panel>
    </div>
  )
}

export function ScAppearanceTab({data, loading}: {data: SearchConsoleData; loading?: boolean}) {
  const maxClicks = data.searchAppearance[0]?.clicks ?? 1

  return (
    <div className="ad-fade">
      <Panel title="Search Appearance" info={SECTION_INFO['Search Appearance']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Type'},
            {label: 'Clicks', align: 'right', width: '76px'},
            {label: 'Impressions', align: 'right', width: '104px'},
            {label: 'CTR', align: 'right', width: '68px'},
            {label: 'Position', align: 'right', width: '82px'},
          ]}
          rows={data.searchAppearance.map(appearance => [
            <span key={appearance.appearance} style={{display: 'block'}}>
              <span style={{color: '#172033', fontWeight: 750}}>{formatAppearance(appearance.appearance)}</span>
              <HorizontalBar value={appearance.clicks} max={maxClicks} color="#8b5cf6" />
            </span>,
            fNum(appearance.clicks),
            fNum(appearance.impressions),
            fCtr(appearance.ctr),
            fPos(appearance.position),
          ])}
        />
      </Panel>
    </div>
  )
}

export function ScSitemapsTab({
  data,
  apiUrl,
  onRefreshData,
  loading,
}: {
  data: SearchConsoleData
  apiUrl: string
  onRefreshData: () => void
  loading?: boolean
}) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitMsg, setSubmitMsg] = useState<{type: 'success' | 'error'; text: string} | null>(null)
  const [newSitemapUrl, setNewSitemapUrl] = useState('')

  const totalSubmitted = data.sitemaps.reduce((sum, sitemap) => sum + sitemap.contents.reduce((contentSum, content) => contentSum + content.submitted, 0), 0)
  const totalIndexed = data.sitemaps.reduce((sum, sitemap) => sum + sitemap.contents.reduce((contentSum, content) => contentSum + content.indexed, 0), 0)
  const indexRate = totalSubmitted > 0 ? totalIndexed / totalSubmitted : 0

  const handleSubmit = async (sitemapUrl: string) => {
    setSubmitting(sitemapUrl)
    setSubmitMsg(null)
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sitemapUrl}),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to submit')
      setSubmitMsg({type: 'success', text: `Sitemap submitted: ${sitemapUrl}`})
      onRefreshData()
    } catch (error: unknown) {
      setSubmitMsg({type: 'error', text: error instanceof Error ? error.message : String(error)})
    } finally {
      setSubmitting(null)
    }
  }

  const handleAddNew = async () => {
    if (!newSitemapUrl.trim()) return
    await handleSubmit(newSitemapUrl.trim())
    setNewSitemapUrl('')
  }

  void submitMsg
  void handleAddNew

  const fDate = (iso: string) => {
    if (!iso) return '-'
    try {
      const date = new Date(iso)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const fTimeAgo = (iso: string) => {
    if (!iso) return ''
    try {
      // eslint-disable-next-line react-hooks/purity -- relative-time label, recomputed each render on purpose
      const diff = Date.now() - new Date(iso).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs}h ago`
      const days = Math.floor(hrs / 24)
      return `${days}d ago`
    } catch {
      return ''
    }
  }

  return (
    <div className="ad-fade" style={{display: 'grid', gap: 18}}>
      <SectionLabel>Indexing Summary</SectionLabel>
      <MetricGrid>
        <MetricCard label="Sitemaps" value={String(data.sitemaps.length)} color="#172033" loading={loading} />
        <MetricCard label="Submitted URLs" value={fNum(totalSubmitted)} color="#6366f1" loading={loading} />
        <MetricCard label="Indexed URLs" value={fNum(totalIndexed)} color="#0f9f6e" loading={loading} />
        <MetricCard
          label="Index Rate"
          value={totalSubmitted > 0 ? `${(indexRate * 100).toFixed(1)}%` : 'N/A'}
          color={indexRate > 0.8 ? '#0f9f6e' : '#f59e0b'}
          loading={loading}
        />
      </MetricGrid>

      <Panel title="Submitted Sitemaps" info={SECTION_INFO['Sitemaps & Indexing']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Sitemap URL'},
            {label: 'Submitted', align: 'right', width: '92px'},
            {label: 'Indexed', align: 'right', width: '82px'},
            {label: 'Rate', align: 'right', width: '68px'},
            {label: 'Last Updated', width: '152px'},
            {label: 'Status', width: '98px'},
          ]}
          rows={data.sitemaps.map(sitemap => {
            const submitted = sitemap.contents.reduce((sum, content) => sum + content.submitted, 0)
            const indexed = sitemap.contents.reduce((sum, content) => sum + content.indexed, 0)
            const hasIssues = sitemap.errors > 0 || sitemap.warnings > 0
            const isSubmitting = submitting === sitemap.path
            void isSubmitting

            return [
              <span key={sitemap.path} style={{display: 'block', minWidth: 0}}>
                <PathCell path={sitemap.path} />
                <HorizontalBar value={indexed} max={Math.max(submitted, 1)} color={hasIssues ? '#ef4444' : '#0f9f6e'} />
              </span>,
              fNum(submitted),
              <span key={`idx-${sitemap.path}`} style={{color: '#0f9f6e', fontWeight: 800}}>{fNum(indexed)}</span>,
              submitted > 0 ? `${((indexed / submitted) * 100).toFixed(0)}%` : '-',
              <span key={`date-${sitemap.path}`} style={{fontSize: 11, color: '#526174', lineHeight: 1.45}}>
                {fDate(sitemap.lastSubmitted)}
                <br />
                <span style={{color: '#8a96a8'}}>{fTimeAgo(sitemap.lastSubmitted)}</span>
              </span>,
              sitemap.isPending ? (
                <StatusPill key={`status-${sitemap.path}`} tone="warning">Pending</StatusPill>
              ) : hasIssues ? (
                <StatusPill key={`status-${sitemap.path}`} tone="danger">
                  {sitemap.errors > 0 ? `${sitemap.errors} errors` : `${sitemap.warnings} warnings`}
                </StatusPill>
              ) : (
                <StatusPill key={`status-${sitemap.path}`} tone="success">OK</StatusPill>
              ),
            ]
          })}
        />
      </Panel>

      <div className="ad-muted-note">
        Data from Google Search Console API - typically 2-3 days behind real-time. Links and Core Web Vitals are available in{' '}
        <a href="https://search.google.com/search-console" target="_blank" rel="noopener">
          Search Console
        </a>
        .
      </div>
    </div>
  )
}

export const OverviewTab = ScOverviewTab
export const QueriesTab = ScQueriesTab
export const PagesTab = ScPagesTab
export const CountriesTab = ScCountriesTab
export const DevicesTab = ScDevicesTab
export const AppearanceTab = ScAppearanceTab
export const SitemapsTab = ScSitemapsTab

export function SearchConsoleTool({apiUrl}: {apiUrl?: string}) {
  return <SearchConsoleDashboard apiUrl={apiUrl || '/api/search-console'} />
}

export type ScTab = Tab
export type SearchConsoleTab = Tab

export function SearchConsoleDashboard({
  apiUrl,
  initialTab = 'overview',
  activeTab: controlledTab,
  onTabChange,
}: {
  apiUrl: string
  initialTab?: ScTab
  activeTab?: ScTab
  onTabChange?: (tab: ScTab) => void
}) {
  const [data, setData] = useState<SearchConsoleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<ScDateRange>('28')
  const [uncontrolledTab, setUncontrolledTab] = useState<ScTab>(initialTab)

  const activeTab = controlledTab !== undefined ? controlledTab : uncontrolledTab

  const handleTabChange = useCallback(
    (nextTab: ScTab) => {
      setUncontrolledTab(nextTab)
      onTabChange?.(nextTab)
    },
    [onTabChange],
  )

  useEffect(() => {
    if (initialTab) {
      setUncontrolledTab(initialTab)
    }
  }, [initialTab])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setData(await fetchSearchConsoleData(apiUrl, dateRange))
    } catch (err: unknown) {
      console.error('Failed to fetch Search Console data', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch Search Console data')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading && !data) {
    return <InitialLoading label="Loading Search Console data..." accent={SC_ACCENT} />
  }

  if (error && !data) {
    return <ErrorState title="Failed to load Search Console data" error={error} onRetry={loadData} accent={SC_ACCENT} />
  }

  if (!data) return null

  return (
    <DashboardShell
      title="Search Console"
      subtitle="Google organic search"
      icon={<Target size={18} />}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      dateRanges={DATE_RANGES}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onRefresh={loadData}
      loading={loading}
      error={error}
      accent={SC_ACCENT}
    >
      {activeTab === 'overview' && <ScOverviewTab data={data} loading={loading} />}
      {activeTab === 'queries' && <ScQueriesTab data={data} loading={loading} />}
      {activeTab === 'pages' && <ScPagesTab data={data} loading={loading} />}
      {activeTab === 'countries' && <ScCountriesTab data={data} loading={loading} />}
      {activeTab === 'devices' && <ScDevicesTab data={data} loading={loading} />}
      {activeTab === 'appearance' && <ScAppearanceTab data={data} loading={loading} />}
      {activeTab === 'sitemaps' && <ScSitemapsTab data={data} apiUrl={apiUrl} onRefreshData={loadData} loading={loading} />}
    </DashboardShell>
  )
}

