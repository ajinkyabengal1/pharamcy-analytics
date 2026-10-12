import React, {useMemo} from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import type {AnalyticsData} from '../ga-types'
import {SECTION_INFO, PALETTE, CHANNEL_COLORS} from '../components/ga-constants'
import {Panel, SkeletonChart} from '../components/shared-ui'

export function TrafficTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  const channelBar = useMemo(
    () =>
      data.channels.map((c) => ({
        name: c.channel,
        Sessions: c.sessions,
        Users: c.users,
      })),
    [data.channels],
  )
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      <Panel title="Users, Sessions & Page Views" info={SECTION_INFO['Users & Sessions Over Time']}>
        {loading ? (
          <SkeletonChart height={300} />
        ) : (
          <div style={{height: 300}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeSeries} margin={{top: 4, right: 8, left: 0, bottom: 0}}>
                <defs>
                  {[
                    ['gU', '#4f8ef7'],
                    ['gS', '#3ecf8e'],
                    ['gP', '#e55353'],
                  ].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  fontSize={11}
                  tick={{fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  fontSize={11}
                  tick={{fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 7,
                    fontSize: 13,
                  }}
                  cursor={{stroke: '#f1f5f9'}}
                />
                <Legend wrapperStyle={{fontSize: 13, paddingTop: 10}} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke="#4f8ef7"
                  fill="url(#gU)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="#3ecf8e"
                  fill="url(#gS)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Pages"
                  stroke="#e55353"
                  fill="url(#gP)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="Traffic by Hour — Today" info={SECTION_INFO['Traffic by Hour — Today']}>
        {loading ? (
          <SkeletonChart height={220} />
        ) : (
          <div style={{height: 220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.hourlyToday}
                margin={{top: 4, right: 8, left: 0, bottom: 0}}
                barSize={12}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  tick={{fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  fontSize={11}
                  tick={{fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 7,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{fontSize: 13, paddingTop: 8}} />
                <Bar dataKey="users" name="Users" fill="#4f8ef7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sessions" name="Sessions" fill="#3ecf8e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="Channel Grouping" info={SECTION_INFO['Channel Grouping']}>
        {loading ? (
          <SkeletonChart height={200} />
        ) : (
          <div style={{height: Math.max(200, data.channels.length * 46)}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelBar}
                layout="vertical"
                margin={{top: 4, right: 24, left: 8, bottom: 0}}
                barSize={11}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  fontSize={11}
                  tick={{fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={12}
                  tick={{fill: '#475569'}}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 7,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{fontSize: 13, paddingTop: 8}} />
                <Bar dataKey="Sessions" radius={[0, 3, 3, 0]}>
                  {channelBar.map((e, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[e.name] ?? PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </div>
  )
}
