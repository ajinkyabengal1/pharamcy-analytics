import React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Search,
  Users,
  Pill,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Layers,
  Globe2,
} from 'lucide-react'
import type {AnalyticsData} from '../ga-types'
import type {SearchConsoleData} from '../search-console/search-console-types'
import {MetricCard, Panel, SkeletonChart} from '../components/shared-ui'
import {fNum, fPct, fDur, PALETTE} from '../components/ga-constants'

export interface CombinedOverviewTabProps {
  gaData: AnalyticsData | null
  scData: SearchConsoleData | null
  loadingGa: boolean
  loadingSc: boolean
  onSelectSection: (section: 'analytics' | 'custom' | 'search-console', subTab?: string) => void
}

export function CombinedOverviewTab({
  gaData,
  scData,
  loadingGa,
  loadingSc,
  onSelectSection,
}: CombinedOverviewTabProps) {
  const loading = loadingGa || loadingSc

  // GA metrics
  const gaOverview = gaData?.overview
  const totalUsers = gaOverview?.totalUsers ?? 0
  const sessions = gaOverview?.sessions ?? 0
  const pageViews = gaOverview?.pageViews ?? 0
  const bounceRate = gaOverview?.bounceRate ?? 0
  const activeNow = gaData?.activeUsers ?? 0

  // SC metrics
  const scOverview = scData?.overview
  const scClicks = scOverview?.clicks ?? 0
  const scImpressions = scOverview?.impressions ?? 0
  const scCtr = scOverview?.ctr ?? 0
  const scPosition = scOverview?.position ?? 0

  // Funnel estimation from GA events
  const findEventCount = (name: string) =>
    gaData?.topEvents?.find((e) => e.name === name)?.count ?? 0

  const conditionViews = findEventCount('condition_viewed')
  const assessmentsStarted = findEventCount('start_assessment_clicked')
  const ordersCompleted = findEventCount('order_success')

  const conversionRate =
    conditionViews > 0 ? ((ordersCompleted / conditionViews) * 100).toFixed(1) : '0.0'

  // Time series blend
  const gaTimeSeries = gaData?.timeSeries ?? []
  const scTimeSeries = scData?.timeSeries ?? []

  return (
    <div className="ad-fade" style={{display: 'flex', flexDirection: 'column', gap: 24}}>
      {/* ── Top Executive Hero Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
            <span
              style={{
                display: 'inline-flex',
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Executive Summary
            </span>
            <span style={{fontSize: 12, color: '#94a3b8'}}>Unified Multi-Channel Pharmacy Analytics</span>
          </div>
          <h2 style={{margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f8fafc'}}>
            Pharmacy Digital Performance Overview
          </h2>
          <p style={{margin: 0, fontSize: 13, color: '#94a3b8', maxWidth: 620, lineHeight: 1.5}}>
            Consolidated intelligence spanning Google Organic Search, visitor interactions, and healthcare consultation & prescription fulfillment funnels.
          </p>
        </div>

        {activeNow > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10,
              padding: '10px 16px',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.35)',
                animation: 'ga-pulse 2s infinite',
              }}
            />
            <div>
              <div style={{fontSize: 11, color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase'}}>
                Active Live Visitors
              </div>
              <div style={{fontSize: 20, fontWeight: 800, color: '#ecfdf5', lineHeight: 1.1}}>
                {activeNow}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Key Unified KPI Cards Across 3 Domains ── */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={14} color="#3b82f6" />
          Cross-Channel Key Performance Indicators
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
          }}
        >
          {/* GSC Clicks */}
          <MetricCard
            label="Organic Search Clicks"
            value={fNum(scClicks)}
            color="#10b981"
            loading={loadingSc}
            info="Google organic search traffic that landed on your pharmacy website"
          />

          {/* GSC Impressions */}
          <MetricCard
            label="Google Impressions"
            value={fNum(scImpressions)}
            color="#6366f1"
            loading={loadingSc}
            info="Number of times your pharmacy appeared in Google Search results"
          />

          {/* GA Total Users */}
          <MetricCard
            label="Total Site Visitors"
            value={fNum(totalUsers)}
            color="#3b82f6"
            loading={loadingGa}
            info="Unique visitors tracked by Google Analytics 4"
          />

          {/* GA Sessions */}
          <MetricCard
            label="Browsing Sessions"
            value={fNum(sessions)}
            color="#0ea5e9"
            loading={loadingGa}
            info="Total browsing sessions across the site"
          />

          {/* Funnel: Pre-consult Starts */}
          <MetricCard
            label="Pre-Consult Starts"
            value={fNum(assessmentsStarted)}
            color="#a855f7"
            loading={loadingGa}
            info="Patients who clicked 'Start Assessment' for a clinical condition"
          />

          {/* Funnel: Completed Orders */}
          <MetricCard
            label="Prescription Orders"
            value={fNum(ordersCompleted)}
            color="#f59e0b"
            loading={loadingGa}
            info="Prescription & treatment checkout completions"
          />
        </div>
      </div>

      {/* ── Quick Domain Jump Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {/* Jump 1: Google Analytics */}
        <div
          onClick={() => onSelectSection('analytics')}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="ga-card-hover"
        >
          <div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                }}
              >
                <BarChart3 size={18} />
              </div>
              <span style={{fontSize: 12, color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2}}>
                Explore <ArrowUpRight size={14} />
              </span>
            </div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4}}>
              Google Analytics (GA4)
            </div>
            <p style={{margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45}}>
              Detailed audience demographics, acquisition channels, device breakdown, and page views.
            </p>
          </div>
          <div style={{marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 14, fontSize: 12}}>
            <div><span style={{color: '#94a3b8'}}>Page Views: </span><strong>{fNum(pageViews)}</strong></div>
            <div><span style={{color: '#94a3b8'}}>Bounce: </span><strong>{fPct(bounceRate)}</strong></div>
          </div>
        </div>

        {/* Jump 2: Custom Analytics */}
        <div
          onClick={() => onSelectSection('custom')}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="ga-card-hover"
        >
          <div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b5cf6',
                }}
              >
                <Pill size={18} />
              </div>
              <span style={{fontSize: 12, color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2}}>
                Explore <ArrowUpRight size={14} />
              </span>
            </div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4}}>
              Custom Patient Funnels
            </div>
            <p style={{margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45}}>
              Patient onboarding journey, pre-consult drop-offs, condition demand, and prescription carts.
            </p>
          </div>
          <div style={{marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 14, fontSize: 12}}>
            <div><span style={{color: '#94a3b8'}}>Condition Views: </span><strong>{fNum(conditionViews)}</strong></div>
            <div><span style={{color: '#94a3b8'}}>Conversion: </span><strong>{conversionRate}%</strong></div>
          </div>
        </div>

        {/* Jump 3: Search Console */}
        <div
          onClick={() => onSelectSection('search-console')}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          className="ga-card-hover"
        >
          <div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <Search size={18} />
              </div>
              <span style={{fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2}}>
                Explore <ArrowUpRight size={14} />
              </span>
            </div>
            <div style={{fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4}}>
              Google Search Console
            </div>
            <p style={{margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45}}>
              Organic search keywords, Google rankings, landing page search visibility, and sitemaps.
            </p>
          </div>
          <div style={{marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 14, fontSize: 12}}>
            <div><span style={{color: '#94a3b8'}}>Avg CTR: </span><strong>{(scCtr * 100).toFixed(1)}%</strong></div>
            <div><span style={{color: '#94a3b8'}}>Avg Position: </span><strong>{scPosition.toFixed(1)}</strong></div>
          </div>
        </div>
      </div>

      {/* ── Main Data Visualizations: Search Trend vs Analytics Trend ── */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18}}>
        {/* Search Console Daily Trend */}
        <Panel
          title="Google Organic Search Trend"
          info="Daily clicks and impressions originating from Google search queries"
        >
          {loadingSc ? (
            <SkeletonChart height={240} />
          ) : scTimeSeries.length === 0 ? (
            <div style={{padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
              No Search Console trend data recorded for this date range.
            </div>
          ) : (
            <div style={{height: 240, width: '100%'}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scTimeSeries} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="scClicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5).replace('-', '/')}
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#f8fafc',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scClicksGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* GA4 Sessions Daily Trend */}
        <Panel
          title="Website Traffic & Sessions Trend"
          info="Daily unique users and overall sessions tracked on the site"
        >
          {loadingGa ? (
            <SkeletonChart height={240} />
          ) : gaTimeSeries.length === 0 ? (
            <div style={{padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
              No Google Analytics trend data recorded for this date range.
            </div>
          ) : (
            <div style={{height: 240, width: '100%'}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gaTimeSeries} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <defs>
                    <linearGradient id="gaUsersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) =>
                      v.length === 8 ? `${v.slice(4, 6)}/${v.slice(6, 8)}` : v
                    }
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#f8fafc',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gaUsersGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Two Column Insights: Top Organic Queries vs Top Visited Pages ── */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18}}>
        {/* Top Google Search Queries */}
        <Panel
          title="Top Organic Google Search Queries"
          info="The search terms driving the most organic search clicks to your pharmacy"
        >
          {loadingSc ? (
            <SkeletonChart height={180} />
          ) : (scData?.queries ?? []).length === 0 ? (
            <div style={{padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
              No organic search queries found.
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {(scData?.queries ?? []).slice(0, 5).map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 7,
                    background: '#f8fafc',
                    fontSize: 13,
                  }}
                >
                  <span style={{fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%'}}>
                    {q.query}
                  </span>
                  <div style={{display: 'flex', gap: 12, fontSize: 12, flexShrink: 0}}>
                    <span style={{color: '#10b981', fontWeight: 700}}>{q.clicks} clicks</span>
                    <span style={{color: '#94a3b8'}}>Pos #{q.position.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Top Visited Pages */}
        <Panel
          title="Top Viewed Website Pages"
          info="Most frequently visited content and condition landing pages"
        >
          {loadingGa ? (
            <SkeletonChart height={180} />
          ) : (gaData?.topPages ?? []).length === 0 ? (
            <div style={{padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13}}>
              No page view records found.
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {(gaData?.topPages ?? []).slice(0, 5).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 7,
                    background: '#f8fafc',
                    fontSize: 13,
                  }}
                >
                  <span style={{fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%'}}>
                    {p.path}
                  </span>
                  <div style={{display: 'flex', gap: 12, fontSize: 12, flexShrink: 0}}>
                    <span style={{color: '#3b82f6', fontWeight: 700}}>{fNum(p.pageViews)} views</span>
                    <span style={{color: '#94a3b8'}}>{fNum(p.users)} users</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <style>{`
        .ga-card-hover:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.05);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
