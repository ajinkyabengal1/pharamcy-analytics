import React from 'react'
import type {AnalyticsData} from '../ga-types'
import {PALETTE, DEVICE_COLORS, SECTION_INFO} from '../components/ga-constants'
import {Panel, Donut} from '../components/shared-ui'

export function AudienceTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12}}>
        <Panel title="Devices" info={SECTION_INFO['Devices']}>
          <Donut
            loading={loading}
            data={data.devices.map((d) => ({
              name: d.device,
              value: d.sessions,
              percentage: d.percentage,
            }))}
            colors={data.devices.map((d) => DEVICE_COLORS[d.device.toLowerCase()] ?? '#4f8ef7')}
          />
        </Panel>
        <Panel title="New vs Returning" info={SECTION_INFO['New vs Returning']}>
          <Donut
            loading={loading}
            data={data.newVsReturning.map((d) => ({
              name: d.type,
              value: d.users,
              percentage: d.percentage,
            }))}
            colors={['#4f8ef7', '#3ecf8e']}
          />
        </Panel>
        <Panel title="Browsers" info={SECTION_INFO['Browsers']}>
          <Donut
            loading={loading}
            data={data.browsers.map((d) => ({
              name: d.browser,
              value: d.sessions,
              percentage: d.percentage,
            }))}
            colors={PALETTE}
          />
        </Panel>
        <Panel title="Operating Systems" info={SECTION_INFO['Operating Systems']}>
          <Donut
            loading={loading}
            data={data.operatingSystems.map((d) => ({
              name: d.os,
              value: d.sessions,
              percentage: d.percentage,
            }))}
            colors={PALETTE}
          />
        </Panel>
      </div>
    </div>
  )
}
