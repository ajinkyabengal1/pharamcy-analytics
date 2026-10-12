import {useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {AlertTriangle, Info, Loader2, RefreshCw} from 'lucide-react'
import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts'

export const GA_ACCENT = {
  primary: '#6366f1',
  secondary: '#06b6d4',
  tertiary: '#f59e0b',
  glow: 'rgba(99, 102, 241, 0.22)',
}

export const SC_ACCENT = {
  primary: '#0f9f6e',
  secondary: '#2563eb',
  tertiary: '#f97316',
  glow: 'rgba(15, 159, 110, 0.22)',
}

export const PALETTE = [
  '#6366f1',
  '#0f9f6e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0891b2',
  '#f97316',
  '#14b8a6',
]

export const CHART_GRID = '#e5edf5'
export const CHART_TICK = '#8290a3'

export const chartTooltipStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: 10,
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
  color: '#172033',
  fontSize: 12,
}

export const DASHBOARD_CSS = `
@keyframes ad-spin { to { transform: rotate(360deg); } }
@keyframes ad-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ad-shimmer { 0% { background-position: -700px 0; } 100% { background-position: 700px 0; } }
@keyframes ad-pulse { 0%, 100% { box-shadow: 0 0 0 4px var(--ad-glow); } 50% { box-shadow: 0 0 0 9px rgba(255,255,255,0); } }
@keyframes ad-glow-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes ad-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ad-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

.ad-shell {
  height: calc(100vh - 52px);
  width: 100%;
  background:
    linear-gradient(145deg, rgba(255,255,255,.72), rgba(241,245,249,.88)),
    radial-gradient(ellipse at 10% 20%, color-mix(in srgb, var(--ad-primary) 8%, transparent), transparent 50%),
    radial-gradient(ellipse at 90% 80%, color-mix(in srgb, var(--ad-secondary) 6%, transparent), transparent 50%),
    #f0f4f9;
  color: #172033;
  display: flex;
  overflow: hidden;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.ad-frame {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.ad-sidebar {
  width: 224px;
  flex: 0 0 224px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.72);
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(24px);
  box-shadow: 18px 0 46px rgba(15, 23, 42, 0.04);
}

.ad-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 22px 28px 34px;
}

.ad-main::-webkit-scrollbar,
.ad-sidebar nav::-webkit-scrollbar,
.ad-table-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.ad-main::-webkit-scrollbar-thumb,
.ad-sidebar nav::-webkit-scrollbar-thumb,
.ad-table-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, .45);
  border-radius: 999px;
}

.ad-brand {
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
}

.ad-brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ad-brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #fff;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--ad-primary), var(--ad-secondary));
  box-shadow: 0 10px 24px var(--ad-glow);
  flex: 0 0 auto;
}

.ad-title {
  font-size: 14px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #101828;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: #728096;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-sidebar-section {
  padding: 13px 12px 8px;
}

.ad-kicker {
  color: #93a0b2;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.ad-segmented {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.ad-button-reset {
  border: 0;
  appearance: none;
  font: inherit;
}

.ad-date-btn {
  height: 31px;
  border-radius: 9px;
  background: rgba(248, 250, 252, 0.86);
  color: #667085;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.24);
  transition: all 0.2s ease;
}

.ad-date-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.38);
}

.ad-date-btn[data-active="true"] {
  background: #fff;
  color: var(--ad-primary);
  box-shadow:
    inset 0 0 0 1.5px color-mix(in srgb, var(--ad-primary) 45%, transparent),
    0 6px 16px var(--ad-glow);
}

/* Pharmacy Selector */
.ad-pharmacy-section {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
}

.ad-pharmacy-select {
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1.5px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.9);
  color: #172033;
  font-size: 12px;
  font-weight: 650;
  padding: 0 10px;
  cursor: pointer;
  outline: none;
  appearance: none;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  padding-right: 28px;
  text-overflow: ellipsis;
}

.ad-pharmacy-select:hover {
  border-color: color-mix(in srgb, var(--ad-primary) 40%, transparent);
  box-shadow: 0 4px 12px var(--ad-glow);
}

.ad-pharmacy-select:focus {
  border-color: var(--ad-primary);
  box-shadow: 0 0 0 3px var(--ad-glow);
}

.ad-nav {
  flex: 1;
  overflow: auto;
  padding: 8px 8px 12px;
}

.ad-tab-btn {
  width: 100%;
  min-width: 0;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  color: #647084;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  text-align: left;
  transition: all 0.18s ease;
}

.ad-tab-btn:hover {
  color: #374151;
  background: rgba(248, 250, 252, 0.8);
}

.ad-tab-btn svg {
  flex: 0 0 auto;
}

.ad-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-tab-btn[data-active="true"] {
  color: var(--ad-primary);
  background: linear-gradient(135deg, #fff, color-mix(in srgb, var(--ad-primary) 7%, #fff));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--ad-primary) 16%, transparent),
    0 8px 18px rgba(15, 23, 42, 0.05);
}

.ad-tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  margin-left: auto;
  background: var(--ad-primary);
  box-shadow: 0 0 0 4px var(--ad-glow);
  flex: 0 0 auto;
  animation: ad-glow-pulse 2s ease-in-out infinite;
}

.ad-refresh-wrap {
  padding: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
}

.ad-refresh {
  width: 100%;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 750;
  box-shadow: 0 12px 26px rgba(15, 23, 42, .16);
  transition: all 0.2s ease;
}

.ad-refresh:hover {
  box-shadow: 0 16px 34px rgba(15, 23, 42, .24);
  transform: translateY(-1px);
}

.ad-refresh:disabled {
  cursor: wait;
  opacity: .72;
  transform: none;
}

.ad-spin {
  animation: ad-spin .9s linear infinite;
}

.ad-topbar {
  position: sticky;
  top: -22px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: -22px -28px 22px;
  padding: 20px 28px 16px;
  background: linear-gradient(180deg, rgba(244, 248, 252, .96), rgba(244, 248, 252, .78) 72%, rgba(244, 248, 252, 0));
  backdrop-filter: blur(10px);
}

.ad-page-title {
  margin: 0;
  color: #101828;
  font-size: 23px;
  line-height: 1.08;
  font-weight: 850;
  letter-spacing: -0.01em;
}

.ad-page-meta {
  margin-top: 5px;
  color: #7b8798;
  font-size: 12px;
  font-weight: 600;
}

.ad-warn-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 260px;
  border-radius: 999px;
  padding: 8px 12px;
  color: #92400e;
  background: #fffbeb;
  box-shadow: inset 0 0 0 1px #fde68a;
  font-size: 12px;
  font-weight: 700;
}

.ad-panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  padding: 18px;
  box-sizing: border-box;
  backdrop-filter: blur(8px);
  animation: ad-scale-in 0.3s ease;
}

.ad-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.ad-panel-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.ad-panel-title {
  color: #172033;
  font-size: 14px;
  font-weight: 780;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #7c8aa0;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.ad-section-label::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: linear-gradient(135deg, var(--ad-primary), var(--ad-secondary));
  box-shadow: 0 0 0 4px var(--ad-glow);
}

.ad-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(154px, 1fr));
  gap: 10px;
}

.ad-metric {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 12px;
  padding: 15px 15px 14px;
  background:
    linear-gradient(145deg, rgba(255,255,255,.96), rgba(248,250,252,.92)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--metric-color) 10%, transparent), transparent 38%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  transition: all 0.25s ease;
  animation: ad-slide-up 0.4s ease;
}

.ad-metric:hover {
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--metric-color) 30%, transparent);
}

.ad-metric::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(180deg, var(--metric-color), color-mix(in srgb, var(--metric-color) 50%, transparent));
}

.ad-metric-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 9px;
}

.ad-metric-label {
  flex: 1;
  min-width: 0;
  color: #778397;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .07em;
  line-height: 1.2;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.ad-metric-value {
  color: #0f172a;
  font-size: 25px;
  line-height: 1;
  font-weight: 880;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.ad-metric-sub {
  margin-top: 6px;
  color: #8a96a8;
  font-size: 12px;
  font-weight: 600;
}

.ad-info-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.ad-info-btn {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 0;
  color: #8794a8;
  background: rgba(148, 163, 184, .13);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: help;
  transition: background 0.15s;
}

.ad-info-btn:hover {
  background: rgba(148, 163, 184, .24);
}

.ad-tip-portal {
  pointer-events: none;
  z-index: 2147483647;
  width: 230px;
  border-radius: 9px;
  padding: 9px 11px;
  background: #111827;
  color: #f8fafc;
  box-shadow: 0 18px 38px rgba(15,23,42,.24);
  font-size: 12px;
  line-height: 1.45;
  font-weight: 500;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  animation: ad-tip-in .12s ease;
}

@keyframes ad-tip-in { from { opacity: 0; } to { opacity: 1; } }

.ad-skel {
  display: block;
  background: linear-gradient(90deg, #eef3f8 25%, #dfe7f0 50%, #eef3f8 75%);
  background-size: 1400px 100%;
  animation: ad-shimmer 1.25s infinite linear;
  border-radius: 6px;
}

.ad-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.ad-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.ad-table th {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, .92);
  color: #8b98aa;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.ad-table td {
  padding: 11px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, .52);
  color: #475569;
  vertical-align: middle;
}

.ad-table tbody tr {
  transition: background .18s ease;
}

.ad-table tbody tr:hover {
  background: color-mix(in srgb, var(--ad-primary) 4%, transparent);
}

.ad-path-cell {
  display: block;
  min-width: 0;
  color: var(--ad-primary);
  font-size: 13px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ad-progress-track {
  height: 5px;
  margin-top: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, .18);
  overflow: hidden;
}

.ad-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--bar-color), color-mix(in srgb, var(--bar-color) 55%, white));
  transition: width .45s cubic-bezier(0.4, 0, 0.2, 1);
}

.ad-status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.ad-fade {
  animation: ad-fadein .28s ease;
}

.ad-empty {
  min-height: 250px;
  display: grid;
  place-items: center;
  color: #8a96a8;
  font-size: 13px;
  font-weight: 650;
}

.ad-active-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 11px 15px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(236, 253, 245, .88), rgba(209, 250, 229, .6));
  color: #047857;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, .22), 0 8px 22px rgba(16, 185, 129, .08);
  font-size: 13px;
  font-weight: 700;
  animation: ad-slide-up 0.3s ease;
}

.ad-active-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #10b981;
  animation: ad-pulse 2s infinite;
}

.ad-muted-note {
  margin-top: 10px;
  color: #8290a3;
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
}

.ad-muted-note a {
  color: var(--ad-primary);
  font-weight: 700;
}

@media (max-width: 860px) {
  .ad-sidebar {
    width: 72px;
    flex-basis: 72px;
  }
  .ad-brand {
    padding-left: 14px;
    padding-right: 14px;
  }
  .ad-brand-copy,
  .ad-kicker,
  .ad-tab-label,
  .ad-tab-dot,
  .ad-refresh span,
  .ad-segmented,
  .ad-pharmacy-section {
    display: none;
  }
  .ad-tab-btn {
    justify-content: center;
    padding: 0;
  }
  .ad-refresh {
    width: 42px;
    margin: 0 auto;
  }
  .ad-main {
    padding-left: 16px;
    padding-right: 16px;
  }
  .ad-topbar {
    margin-left: -16px;
    margin-right: -16px;
    padding-left: 16px;
    padding-right: 16px;
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .ad-shell {
    height: auto;
    min-height: calc(100vh - 51px);
  }
  .ad-frame {
    min-height: calc(100vh - 51px);
  }
  .ad-page-title {
    font-size: 20px;
  }
  .ad-panel {
    padding: 14px;
  }
  .ad-metric-grid {
    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
  }
}
`

interface AccentVars extends CSSProperties {
  '--ad-primary': string
  '--ad-secondary': string
  '--ad-tertiary': string
  '--ad-glow': string
}

export interface DashboardTab<T extends string> {
  id: T
  label: string
  icon: ReactNode
  group?: string
}

export interface DashboardRange<T extends string> {
  label: string
  value: T
}

export function accentVars(accent: typeof GA_ACCENT): AccentVars {
  return {
    '--ad-primary': accent.primary,
    '--ad-secondary': accent.secondary,
    '--ad-tertiary': accent.tertiary,
    '--ad-glow': accent.glow,
  }
}

export function DashboardShell<T extends string, R extends string>({
  title,
  subtitle,
  icon,
  tabs,
  activeTab,
  onTabChange,
  dateRanges,
  dateRange,
  onDateRangeChange,
  onRefresh,
  loading,
  error,
  children,
  accent,
  pharmacySelector,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  tabs: DashboardTab<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  dateRanges: DashboardRange<R>[]
  dateRange: R
  onDateRangeChange: (range: R) => void
  onRefresh: () => void
  loading: boolean
  error: string | null
  children: ReactNode
  accent: typeof GA_ACCENT
  pharmacySelector?: ReactNode
}) {
  const active = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="ad-shell" style={accentVars(accent)}>
      <style>{DASHBOARD_CSS}</style>
      <div className="ad-frame">
        <aside className="ad-sidebar">
          <div className="ad-brand">
            <div className="ad-brand-row">
              <div className="ad-brand-mark">{icon}</div>
              <div className="ad-brand-copy" style={{minWidth: 0}}>
                <div className="ad-title">{title}</div>
                <div className="ad-subtitle">{subtitle}</div>
              </div>
            </div>
          </div>

          {pharmacySelector && (
            <div className="ad-pharmacy-section">
              <div className="ad-kicker">Pharmacy</div>
              {pharmacySelector}
            </div>
          )}

          <div className="ad-sidebar-section">
            <div className="ad-kicker">Date Range</div>
            <div className="ad-segmented">
              {dateRanges.map(range => (
                <button
                  key={range.value}
                  className="ad-button-reset ad-date-btn"
                  data-active={dateRange === range.value}
                  onClick={() => onDateRangeChange(range.value)}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="ad-nav">
            <div className="ad-kicker" style={{paddingLeft: 8}}>Sections</div>
            {tabs.map((tab, index) => {
              const previousGroup = index > 0 ? tabs[index - 1]?.group : undefined
              const shouldShowGroup = tab.group && tab.group !== previousGroup

              return (
                <div key={tab.id}>
                  {shouldShowGroup && (
                    <div className="ad-kicker" style={{paddingLeft: 8, marginTop: 14}}>
                      {tab.group}
                    </div>
                  )}
                  <button
                    className="ad-button-reset ad-tab-btn"
                    data-active={tab.id === activeTab}
                    onClick={() => onTabChange(tab.id)}
                    title={tab.label}
                    type="button"
                  >
                    {tab.icon}
                    <span className="ad-tab-label">{tab.label}</span>
                    {tab.id === activeTab && <span className="ad-tab-dot" />}
                  </button>
                </div>
              )
            })}
          </nav>

          <div className="ad-refresh-wrap">
            <button
              className="ad-button-reset ad-refresh"
              disabled={loading}
              onClick={onRefresh}
              type="button"
            >
              {loading ? <Loader2 size={15} className="ad-spin" /> : <RefreshCw size={15} />}
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </aside>

        <main className="ad-main">
          <div className="ad-topbar">
            <div style={{minWidth: 0}}>
              <h2 className="ad-page-title">{active?.label ?? title}</h2>
              <div className="ad-page-meta">Last {dateRange} days</div>
            </div>
            {error && (
              <div className="ad-warn-pill" title={error}>
                <AlertTriangle size={15} />
                <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  Showing cached data
                </span>
              </div>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export function InitialLoading({
  label,
  accent,
}: {
  label: string
  accent: typeof GA_ACCENT
}) {
  return (
    <div className="ad-shell" style={accentVars(accent)}>
      <style>{DASHBOARD_CSS}</style>
      <div style={{display: 'grid', placeItems: 'center', width: '100%'}}>
        <div style={{display: 'grid', gap: 14, justifyItems: 'center'}}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: '3px solid rgba(148, 163, 184, .28)',
              borderTopColor: accent.primary,
              animation: 'ad-spin .8s linear infinite',
            }}
          />
          <div style={{fontSize: 14, fontWeight: 700, color: '#6b778a'}}>{label}</div>
        </div>
      </div>
    </div>
  )
}

export function ErrorState({
  title,
  error,
  onRetry,
  accent,
}: {
  title: string
  error: string
  onRetry: () => void
  accent: typeof GA_ACCENT
}) {
  return (
    <div className="ad-shell" style={accentVars(accent)}>
      <style>{DASHBOARD_CSS}</style>
      <div style={{display: 'grid', placeItems: 'center', width: '100%', padding: 24}}>
        <div className="ad-panel" style={{maxWidth: 520, width: '100%', padding: 28}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
            <div className="ad-brand-mark" style={{background: '#ef4444', boxShadow: '0 14px 28px rgba(239,68,68,.18)'}}>
              <AlertTriangle size={19} />
            </div>
            <div style={{fontSize: 17, fontWeight: 850, color: '#991b1b'}}>{title}</div>
          </div>
          <div style={{fontSize: 13, color: '#667085', lineHeight: 1.6, marginBottom: 18}}>
            {error}
          </div>
          <button className="ad-button-reset ad-refresh" onClick={onRetry} type="button" style={{width: 'auto', padding: '0 18px'}}>
            <RefreshCw size={15} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function InfoIcon({text}: {text: string}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [tip, setTip] = useState<{top: number; left: number; placement: 'top' | 'bottom'} | null>(null)

  const show = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Flip below the trigger when there is not enough room above (e.g. under the sticky topbar).
    const placeBelow = rect.top < 120
    setTip({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      placement: placeBelow ? 'bottom' : 'top',
    })
  }

  const hide = () => setTip(null)

  return (
    <span className="ad-info-wrap" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={triggerRef}
        className="ad-info-btn"
        tabIndex={-1}
        type="button"
        onFocus={show}
        onBlur={hide}
      >
        <Info size={12} />
      </button>
      {tip && typeof document !== 'undefined' &&
        createPortal(
          <span
            className="ad-tip-portal"
            style={{
              position: 'fixed',
              top: tip.top,
              left: tip.left,
              transform: tip.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  )
}

export function Skel({
  w,
  h = 14,
  r = 6,
  style,
}: {
  w?: string | number
  h?: number
  r?: number
  style?: CSSProperties
}) {
  return <span className="ad-skel" style={{width: w ?? '100%', height: h, borderRadius: r, ...style}} />
}

export function SectionLabel({children}: {children: ReactNode}) {
  return <div className="ad-section-label">{children}</div>
}

export function Panel({
  title,
  info,
  children,
  style,
}: {
  title?: string
  info?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <section className="ad-panel" style={style}>
      {title && (
        <div className="ad-panel-head">
          <div className="ad-panel-title-row">
            <div className="ad-panel-title">{title}</div>
            {info && <InfoIcon text={info} />}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}

export function MetricGrid({children, style}: {children: ReactNode; style?: CSSProperties}) {
  return <div className="ad-metric-grid" style={style}>{children}</div>
}

export function MetricCard({
  label,
  value,
  sub,
  color,
  info,
  loading,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  info?: string
  loading?: boolean
}) {
  const metricStyle = {'--metric-color': color ?? '#6366f1'} as CSSProperties

  return (
    <div className="ad-metric" style={metricStyle}>
      <div className="ad-metric-top">
        <div className="ad-metric-label">{label}</div>
        {info && <InfoIcon text={info} />}
      </div>
      {loading ? (
        <>
          <Skel w="58%" h={25} />
          {sub && <Skel w="44%" h={12} style={{marginTop: 7}} />}
        </>
      ) : (
        <>
          <div className="ad-metric-value" style={{color: color ?? '#0f172a'}}>{value}</div>
          {sub && <div className="ad-metric-sub">{sub}</div>}
        </>
      )}
    </div>
  )
}

export function ActiveBadge({
  count,
  loading,
  info,
}: {
  count: number
  loading?: boolean
  info: string
}) {
  return (
    <div className="ad-active-badge">
      <span className="ad-active-dot" />
      {loading ? <Skel w={76} h={22} /> : <span style={{fontSize: 22, fontWeight: 880}}>{count.toLocaleString()}</span>}
      <span>users active right now</span>
      <InfoIcon text={info} />
    </div>
  )
}

export function DataTable({
  headers,
  rows,
  empty = 'No data',
  loading,
  skeletonRows = 6,
}: {
  headers: {label: string; align?: 'left' | 'right'; width?: string}[]
  rows: ReactNode[][]
  empty?: string
  loading?: boolean
  skeletonRows?: number
}) {
  return (
    <div className="ad-table-scroll">
      <table className="ad-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={`${header.label}-${index}`}
                style={{
                  textAlign: header.align ?? 'left',
                  width: header.width,
                }}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({length: skeletonRows}).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, cellIndex) => (
                  <td key={cellIndex}>
                    <Skel w={cellIndex === 0 ? `${58 + ((rowIndex * 9) % 32)}%` : '70%'} h={12} />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{padding: 28, textAlign: 'center', color: '#8a96a8'}}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      textAlign: headers[cellIndex]?.align ?? 'left',
                      color: cellIndex === 0 ? '#263244' : '#526174',
                      fontWeight: cellIndex === 0 ? 650 : 600,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PathCell({path}: {path: string}) {
  return <span className="ad-path-cell" title={path}>{path}</span>
}

export function HorizontalBar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const width = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const style = {'--bar-color': color} as CSSProperties

  return (
    <div className="ad-progress-track">
      <div className="ad-progress-fill" style={{...style, width: `${width}%`}} />
    </div>
  )
}

export function Donut({
  data,
  colors,
  loading,
  formatter,
  info,
}: {
  data: {name: string; value: number; percentage: number}[]
  colors: string[]
  loading?: boolean
  formatter: (value: number) => string
  info?: string
}) {
  if (loading) {
    return (
      <div>
        <div style={{display: 'grid', placeItems: 'center', padding: '12px 0 16px'}}>
          <Skel w={132} h={132} r={999} />
        </div>
        <div style={{display: 'grid', gap: 9}}>
          {Array.from({length: 3}).map((_, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <Skel w={9} h={9} r={3} />
              <Skel w={`${50 + index * 13}%`} h={12} />
              <Skel w={34} h={12} style={{marginLeft: 'auto'}} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) return <div className="ad-empty">No data</div>

  return (
    <div>
      <div style={{height: 184}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => formatter(Number(value))} contentStyle={chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {info && <div className="ad-muted-note" style={{margin: '-2px 0 10px'}}>{info}</div>}
      <div style={{display: 'grid', gap: 8}}>
        {data.map((entry, index) => (
          <div key={entry.name} style={{display: 'flex', alignItems: 'center', gap: 8, minWidth: 0}}>
            <span style={{width: 9, height: 9, borderRadius: 3, background: colors[index % colors.length], flex: '0 0 auto'}} />
            <span style={{flex: 1, minWidth: 0, color: '#526174', fontSize: 13, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize'}}>
              {entry.name}
            </span>
            <span style={{color: '#8a96a8', fontSize: 12, fontWeight: 700}}>{entry.percentage}%</span>
            <span style={{color: '#172033', fontSize: 13, fontWeight: 800, minWidth: 42, textAlign: 'right'}}>{formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({height}: {height: number}) {
  return (
    <div style={{position: 'relative', height, overflow: 'hidden'}}>
      <Skel h={height} r={8} />
      <div style={{position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', justifyContent: 'space-between', gap: 8}}>
        {Array.from({length: 7}).map((_, index) => <Skel key={index} w={34} h={10} r={4} />)}
      </div>
    </div>
  )
}

export function EmptyState({children = 'No data to display'}: {children?: ReactNode}) {
  return <div className="ad-panel ad-empty">{children}</div>
}

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  children: ReactNode
}) {
  const tones: Record<typeof tone, CSSProperties> = {
    success: {background: '#ecfdf5', color: '#047857', boxShadow: 'inset 0 0 0 1px rgba(16,185,129,.22)'},
    warning: {background: '#fffbeb', color: '#92400e', boxShadow: 'inset 0 0 0 1px rgba(245,158,11,.24)'},
    danger: {background: '#fef2f2', color: '#b42318', boxShadow: 'inset 0 0 0 1px rgba(239,68,68,.2)'},
    neutral: {background: '#f1f5f9', color: '#475569', boxShadow: 'inset 0 0 0 1px rgba(148,163,184,.24)'},
  }

  return <span className="ad-status-pill" style={tones[tone]}>{children}</span>
}
