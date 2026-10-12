import React from 'react'
import type {AnalyticsData} from '../ga-types'
import {fNum, fDur, fPct, fEngPct, METRIC_INFO} from '../components/ga-constants'
import {MetricCard, ActiveBadge, SectionLabel} from '../components/shared-ui'

export function OverviewTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  return (
    <div style={{animation: 'ga-fadein .25s ease'}}>
      <ActiveBadge count={data.activeUsers} loading={loading} />

      <SectionLabel>Key Metrics</SectionLabel>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24}}>
        {(
          [
            ['Total Users', fNum(data.overview.totalUsers), '#4f8ef7'],
            ['New Users', fNum(data.overview.newUsers), '#3ecf8e'],
            ['Sessions', fNum(data.overview.sessions), '#f6b93b'],
            ['Page Views', fNum(data.overview.pageViews), '#e55353'],
            ['Avg. Duration', fDur(data.overview.avgSessionDuration), '#a55eea'],
            ['Bounce Rate', fPct(data.overview.bounceRate), '#fd9644'],
          ] as [string, string, string][]
        ).map(([l, v, c]) => (
          <MetricCard
            key={l}
            label={l}
            value={v}
            color={c}
            info={METRIC_INFO[l]}
            loading={loading}
          />
        ))}
      </div>

      <SectionLabel>Engagement</SectionLabel>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
        {(
          [
            ['Engaged Sessions', fNum(data.overview.engagedSessions), '#26c0d3'],
            ['Engagement Rate', fEngPct(data.overview.engagementRate), '#3ecf8e'],
            ['Pages / Session', data.overview.pagesPerSession.toFixed(1), '#8b5cf6'],
            ['Events / Session', data.overview.eventsPerSession.toFixed(1), '#f59e0b'],
          ] as [string, string, string][]
        ).map(([l, v, c]) => (
          <MetricCard
            key={l}
            label={l}
            value={v}
            color={c}
            info={METRIC_INFO[l]}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
