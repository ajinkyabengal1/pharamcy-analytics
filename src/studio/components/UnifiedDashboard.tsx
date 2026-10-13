import React, {useState, useEffect, useCallback, useRef} from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Pill,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import type {AnalyticsData, DateRange} from '../ga-types'
import type {SearchConsoleData, ScDateRange} from '../search-console/search-console-types'
import {fetchAnalyticsData} from '../utils-ga-api'
import {fetchSearchConsoleData} from '../search-console/sc-api'
import {DATE_RANGES, GLOBAL_CSS} from './ga-constants'

// GA tabs
import {OverviewTab} from '../tabs/overview-tab'
import {TrafficTab} from '../tabs/traffic-tab'
import {ContentTab} from '../tabs/content-tab'
import {AudienceTab} from '../tabs/audience-tab'
import {GeographyTab} from '../tabs/geography-tab'
import {EventsTab} from '../tabs/events-tab'
import {AcquisitionTab} from '../tabs/acquisition-tab'

// Custom funnel tabs
import {ConditionsProductsTab} from '../tabs/conditions-products-tab'
import {FunnelEventsTab} from '../funnel/funnel-events-tab'
import {PmFunnelTab} from '../funnel/pm-funnel-tab'

// Search Console dashboard & types
import {
  SearchConsoleDashboard,
  type ScTab,
} from '../search-console/search-console-dashboard'

// Combined executive overview tab
import {CombinedOverviewTab} from '../tabs/combined-overview-tab'

export type MainSection = 'all' | 'analytics' | 'custom' | 'search-console'

export type UnifiedTabId =
  | 'all-overview'
  // GA tabs
  | 'overview'
  | 'traffic'
  | 'content'
  | 'audience'
  | 'geography'
  | 'events'
  | 'acquisition'
  // Custom tabs
  | 'conditions-products'
  | 'funnel'
  | 'pm-funnel'
  // SC tabs
  | 'sc-overview'
  | 'sc-queries'
  | 'sc-pages'
  | 'sc-countries'
  | 'sc-devices'
  | 'sc-appearance'
  | 'sc-sitemaps'

export interface UnifiedDashboardProps {
  apiUrl?: string
  scApiUrl?: string
  brandName?: string
}


const GA_SUB_TABS = [
  {id: 'overview', label: 'Overview', icon: '▦'},
  {id: 'traffic', label: 'Traffic', icon: '↗'},
  {id: 'content', label: 'Content', icon: '≡'},
  {id: 'audience', label: 'Audience', icon: '◉'},
  {id: 'geography', label: 'Geography', icon: '⊕'},
  {id: 'events', label: 'Events', icon: '⚡'},
  {id: 'acquisition', label: 'Acquisition', icon: '⤴'},
]

const CUSTOM_SUB_TABS = [
  {id: 'conditions-products', label: 'Overview', icon: '🧬'},
  {id: 'funnel', label: 'Pre Consult Events', icon: '⬡'},
  {id: 'pm-funnel', label: 'PM Funnel Events', icon: '💊'},
]

const SC_SUB_TABS: {id: UnifiedTabId; scId: ScTab; label: string; icon: string}[] = [
  {id: 'sc-overview', scId: 'overview', label: 'Overview', icon: '◎'},
  {id: 'sc-queries', scId: 'queries', label: 'Top Queries', icon: '🔍'},
  {id: 'sc-pages', scId: 'pages', label: 'Top Pages', icon: '📄'},
  {id: 'sc-countries', scId: 'countries', label: 'Countries', icon: '🌐'},
  {id: 'sc-devices', scId: 'devices', label: 'Devices', icon: '📱'},
  {id: 'sc-appearance', scId: 'appearance', label: 'Appearance', icon: '✨'},
  {id: 'sc-sitemaps', scId: 'sitemaps', label: 'Sitemaps', icon: '🗺️'},
]

function mapToScRange(range: DateRange): ScDateRange {
  if (range === '7') return '7'
  if (range === '14' || range === '30') return '28'
  if (range === '90') return '90'
  return '28'
}

export function UnifiedDashboard({
  apiUrl = '/api/analytics',
  scApiUrl,
  brandName = 'Pharmacy Analytics',
}: UnifiedDashboardProps) {
  // Main center section: 'all' | 'analytics' | 'custom' | 'search-console'
  const [activeMainSection, setActiveMainSection] = useState<MainSection>('all')
  const [activeTab, setActiveTab] = useState<UnifiedTabId>('all-overview')
  const [scActiveTab, setScActiveTab] = useState<ScTab>('overview')

  // Date range
  const [dateRange, setDateRange] = useState<DateRange>('30')

  // Sidebar collapsible groups
  const [gaOpen, setGaOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(true)
  const [scOpen, setScOpen] = useState(true)

  // Data states
  const [gaData, setGaData] = useState<AnalyticsData | null>(null)
  const [scData, setScData] = useState<SearchConsoleData | null>(null)

  const [loadingGa, setLoadingGa] = useState(true)
  const [loadingSc, setLoadingSc] = useState(true)

  const [gaError, setGaError] = useState<string | null>(null)
  const [scError, setScError] = useState<string | null>(null)

  const gaAbortRef = useRef<AbortController | null>(null)
  const scAbortRef = useRef<AbortController | null>(null)

  const effectiveScUrl = scApiUrl || apiUrl

  /* ── Load GA data ── */
  const loadGaData = useCallback(async () => {
    gaAbortRef.current?.abort()
    const controller = new AbortController()
    gaAbortRef.current = controller
    try {
      setLoadingGa(true)
      setGaError(null)
      const data = await fetchAnalyticsData(apiUrl, dateRange, controller.signal)
      setGaData(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load Google Analytics:', err)
      setGaError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      if (!controller.signal.aborted) setLoadingGa(false)
    }
  }, [apiUrl, dateRange])

  /* ── Load Search Console data ── */
  const loadScData = useCallback(async () => {
    scAbortRef.current?.abort()
    const controller = new AbortController()
    scAbortRef.current = controller
    try {
      setLoadingSc(true)
      setScError(null)
      const scRange = mapToScRange(dateRange)
      const data = await fetchSearchConsoleData(effectiveScUrl, scRange, controller.signal)
      setScData(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to load Search Console:', err)
      setScError(err instanceof Error ? err.message : 'Failed to fetch Search Console')
    } finally {
      if (!controller.signal.aborted) setLoadingSc(false)
    }
  }, [effectiveScUrl, dateRange])

  /* ── Master load ── */
  const loadAllData = useCallback(() => {
    loadGaData()
    loadScData()
  }, [loadGaData, loadScData])

  useEffect(() => {
    loadAllData()
    return () => {
      gaAbortRef.current?.abort()
      scAbortRef.current?.abort()
    }
  }, [loadAllData])

  /* ── Center Tab Switcher handler ── */
  const handleMainSectionChange = (section: MainSection) => {
    setActiveMainSection(section)
    if (section === 'all') {
      setActiveTab('all-overview')
    } else if (section === 'analytics') {
      setActiveTab('overview')
    } else if (section === 'custom') {
      setActiveTab('conditions-products')
    } else if (section === 'search-console') {
      setScActiveTab('overview')
    }
  }

  /* ── Tab title helper ── */
  const getTabTitle = () => {
    if (activeTab === 'all-overview') return 'Consolidated Executive Overview'
    const gaMatch = GA_SUB_TABS.find((t) => t.id === activeTab)
    if (gaMatch) return `Google Analytics — ${gaMatch.label}`
    const customMatch = CUSTOM_SUB_TABS.find((t) => t.id === activeTab)
    if (customMatch) return `Custom Analytics — ${customMatch.label}`
    const scMatch = SC_SUB_TABS.find((t) => t.id === activeTab)
    if (scMatch) return `Search Console — ${scMatch.label}`
    return 'Analytics'
  }

  const anyLoading = loadingGa || loadingSc

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 52px)',
        maxHeight: 'calc(100vh - 52px)',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .ad-shell {
          height: 100% !important;
          max-height: 100% !important;
        }
        .ad-center-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ad-center-pill:hover {
          color: #1e293b;
          background: #f1f5f9;
        }
        .ad-center-pill.active {
          color: #fff;
          background: #2563eb;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.28);
        }
        .ad-subtab-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px 7px 18px;
          border-radius: 7px;
          margin-bottom: 2px;
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          color: #64748b;
          text-align: left;
          transition: background 0.1s ease;
        }
        .ad-subtab-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .ad-subtab-btn.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP HEADER BAR WITH CENTRALIZED TAB SWITCHER
         ═══════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          height: 54,
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 20,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Left: Branding */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10, minWidth: 200}}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            }}
          >
            H
          </div>
          <div>
            <div style={{fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.2}}>
              {brandName}
            </div>
            <div style={{fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em'}}>
              Unified Intelligence
            </div>
          </div>
        </div>

        {/* ══ CENTER: CENTRALIZED TAB SWITCHER (All, Analytics, Custom Analytics, Search Console) ══ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: 3,
            gap: 2,
          }}
        >
          {/* Option 1: All */}
          <button
            className={`ad-center-pill ${activeMainSection === 'all' ? 'active' : ''}`}
            onClick={() => handleMainSectionChange('all')}
          >
            <LayoutDashboard size={15} />
            <span>All</span>
          </button>

          {/* Option 2: Analytics */}
          <button
            className={`ad-center-pill ${activeMainSection === 'analytics' ? 'active' : ''}`}
            onClick={() => handleMainSectionChange('analytics')}
          >
            <BarChart3 size={15} />
            <span>Analytics</span>
          </button>

          {/* Option 3: Custom Analytics */}
          <button
            className={`ad-center-pill ${activeMainSection === 'custom' ? 'active' : ''}`}
            onClick={() => handleMainSectionChange('custom')}
          >
            <Pill size={15} />
            <span>Custom Analytics</span>
          </button>

          {/* Option 4: Search Console */}
          <button
            className={`ad-center-pill ${activeMainSection === 'search-console' ? 'active' : ''}`}
            onClick={() => handleMainSectionChange('search-console')}
          >
            <Search size={15} />
            <span>Search Console</span>
          </button>
        </div>

        {/* Right: Date Range Selector & Refresh */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, justifyContent: 'flex-end'}}>
          {activeMainSection === 'search-console' ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(15, 159, 110, 0.08)',
                  color: '#0f9f6e',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid rgba(15, 159, 110, 0.2)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0f9f6e',
                  }}
                />
                Search Console API
              </span>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: '#64748b',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                }}
              >
                <span>Console</span>
                <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <>
              {/* Quick Date Range */}
              <div style={{display: 'flex', gap: 3, background: '#f1f5f9', padding: 2, borderRadius: 7}}>
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setDateRange(r.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: dateRange === r.value ? 700 : 500,
                      borderRadius: 5,
                      border: 'none',
                      background: dateRange === r.value ? '#fff' : 'transparent',
                      color: dateRange === r.value ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      boxShadow: dateRange === r.value ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Master Refresh */}
              <button
                onClick={loadAllData}
                title="Refresh All Analytics"
                style={{
                  padding: '6px 10px',
                  borderRadius: 7,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: anyLoading ? '#94a3b8' : '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <RefreshCw size={13} className={anyLoading ? 'ga-spin' : ''} />
                <span>{anyLoading ? 'Refreshing' : 'Refresh'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN BODY LAYOUT
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeMainSection === 'search-console' ? (
        <div style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
          <SearchConsoleDashboard
            apiUrl={effectiveScUrl}
            initialTab={scActiveTab}
            activeTab={scActiveTab}
            onTabChange={setScActiveTab}
          />
        </div>
      ) : (
        <div style={{display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden'}}>
        {/* ── SIDEBAR ── */}
        <aside
          style={{
            width: 235,
            background: '#fff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Top of Sidebar: Combined Executive link */}
          <div style={{padding: '14px 12px 6px'}}>
            {(activeMainSection === 'all' || activeTab === 'all-overview') && (
              <button
                className={`ad-subtab-btn ${activeTab === 'all-overview' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMainSection('all')
                  setActiveTab('all-overview')
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  marginBottom: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeTab === 'all-overview' ? '#eff6ff' : '#f8fafc',
                  border: activeTab === 'all-overview' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  color: activeTab === 'all-overview' ? '#1d4ed8' : '#334155',
                }}
              >
                <LayoutDashboard size={16} />
                <span>Executive Overview</span>
              </button>
            )}
          </div>

          {/* Subsystem Navigation Groups */}
          <nav style={{flex: 1, overflowY: 'auto', padding: '0 10px 16px'}}>
            {/* ── 1. Google Analytics Group (Shown in 'all' and 'analytics') ── */}
            {(activeMainSection === 'all' || activeMainSection === 'analytics') && (
              <div style={{marginBottom: 14}}>
                <button
                  onClick={() => setGaOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Google Analytics
                  </span>
                  <span style={{fontSize: 11, color: '#94a3b8'}}>{gaOpen ? '▾' : '▸'}</span>
                </button>

                {gaOpen &&
                  GA_SUB_TABS.map((tab) => {
                    const active = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        className={`ad-subtab-btn ${active ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(tab.id as UnifiedTabId)
                          if (activeMainSection !== 'all') setActiveMainSection('analytics')
                        }}
                      >
                        <span style={{opacity: 0.8, width: 16, display: 'inline-flex'}}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {active && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#2563eb',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
              </div>
            )}

            {/* ── 2. Custom Analytics Group (Shown in 'all' and 'custom') ── */}
            {(activeMainSection === 'all' || activeMainSection === 'custom') && (
              <div style={{marginBottom: 14}}>
                <button
                  onClick={() => setCustomOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Custom Analytics
                  </span>
                  <span style={{fontSize: 11, color: '#94a3b8'}}>{customOpen ? '▾' : '▸'}</span>
                </button>

                {customOpen &&
                  CUSTOM_SUB_TABS.map((tab) => {
                    const active = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        className={`ad-subtab-btn ${active ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(tab.id as UnifiedTabId)
                          if (activeMainSection !== 'all') setActiveMainSection('custom')
                        }}
                      >
                        <span style={{opacity: 0.8, width: 16, display: 'inline-flex'}}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {active && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#2563eb',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
              </div>
            )}

            {/* ── 3. Google Search Console Group (Shown in 'all') ── */}
            {activeMainSection === 'all' && (
              <div style={{marginBottom: 14}}>
                <button
                  onClick={() => setScOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Search Console
                  </span>
                  <span style={{fontSize: 11, color: '#94a3b8'}}>{scOpen ? '▾' : '▸'}</span>
                </button>

                {scOpen &&
                  SC_SUB_TABS.map((tab) => {
                    const isScActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        className={`ad-subtab-btn ${isScActive ? 'active' : ''}`}
                        onClick={() => {
                          setScActiveTab(tab.scId)
                          setActiveMainSection('search-console')
                        }}
                      >
                        <span style={{opacity: 0.8, width: 16, display: 'inline-flex'}}>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {isScActive && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#0f9f6e',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
              </div>
            )}
          </nav>

          {/* Bottom of Sidebar: Config Status Hints */}
          <div style={{padding: 12, borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: gaError ? '#ef4444' : '#10b981',
                }}
              />
              <span>GA4: {gaError ? 'Error' : 'Connected'}</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: scError ? '#ef4444' : '#10b981',
                }}
              />
              <span>Search Console: {scError ? 'Needs Config' : 'Connected'}</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT VIEWPORT ── */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '24px 28px',
          }}
        >
          {/* Header Title inside Main */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a'}}>
                {getTabTitle()}
              </h2>
              <div style={{fontSize: 12, color: '#64748b', marginTop: 4}}>
                Selected period: Last {dateRange} days
              </div>
            </div>


          </div>

          {/* ══ VIEW RENDERING ══ */}

          {/* 1. Combined Executive Overview ("All") */}
          {activeTab === 'all-overview' && (
            <CombinedOverviewTab
              gaData={gaData}
              scData={scData}
              loadingGa={loadingGa}
              loadingSc={loadingSc}
              onSelectSection={(section, subTab) => {
                if (section === 'search-console') {
                  const mapped = subTab ? (subTab.replace('sc-', '') as ScTab) : 'overview'
                  setScActiveTab(mapped)
                  setActiveMainSection('search-console')
                } else {
                  setActiveMainSection(section)
                  if (subTab) {
                    setActiveTab(subTab as UnifiedTabId)
                  } else if (section === 'analytics') {
                    setActiveTab('overview')
                  } else if (section === 'custom') {
                    setActiveTab('conditions-products')
                  }
                }
              }}
            />
          )}

          {/* 2. Google Analytics Tabs */}
          {activeTab === 'overview' && gaData && (
            <OverviewTab data={gaData} loading={loadingGa} />
          )}
          {activeTab === 'traffic' && gaData && (
            <TrafficTab data={gaData} loading={loadingGa} />
          )}
          {activeTab === 'content' && gaData && (
            <ContentTab data={gaData} loading={loadingGa} />
          )}
          {activeTab === 'audience' && gaData && (
            <AudienceTab data={gaData} loading={loadingGa} />
          )}
          {activeTab === 'geography' && gaData && (
            <GeographyTab data={gaData} loading={loadingGa} />
          )}
          {activeTab === 'events' && gaData && (
            <EventsTab data={gaData} loading={loadingGa} apiUrl={apiUrl} dateRange={dateRange} />
          )}
          {activeTab === 'acquisition' && gaData && (
            <AcquisitionTab data={gaData} loading={loadingGa} />
          )}

          {/* 3. Custom Analytics Tabs */}
          {activeTab === 'conditions-products' && (
            <ConditionsProductsTab apiUrl={apiUrl} dateRange={dateRange} />
          )}
          {activeTab === 'funnel' && (
            <FunnelEventsTab apiUrl={apiUrl} dateRange={dateRange} />
          )}
          {activeTab === 'pm-funnel' && (
            <PmFunnelTab apiUrl={apiUrl} dateRange={dateRange} />
          )}

          {/* 4. Google Search Console Tabs (Full Strachans UI) */}
          {activeTab.startsWith('sc-') && (
            <SearchConsoleDashboard
              apiUrl={effectiveScUrl}
              initialTab={(activeTab.replace('sc-', '') as ScTab) || 'overview'}
              activeTab={scActiveTab}
              onTabChange={setScActiveTab}
            />
          )}
        </main>
      </div>
      )}
    </div>
  )
}
