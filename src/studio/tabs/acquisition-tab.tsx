import React from 'react'
import type {AnalyticsData} from '../ga-types'
import {fNum, SECTION_INFO} from '../components/ga-constants'
import {Panel, DataTable} from '../components/shared-ui'

export function AcquisitionTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      <Panel title="Traffic Sources" info={SECTION_INFO['Traffic Sources']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Source / Medium'},
            {label: 'Sessions', align: 'right', width: '82px'},
            {label: 'Users', align: 'right', width: '65px'},
          ]}
          rows={data.trafficSources.map((s) => [
            s.source || '(direct)',
            fNum(s.sessions),
            fNum(s.users),
          ])}
        />
      </Panel>
      <Panel title="Top Referrers" info={SECTION_INFO['Top Referrers']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Referrer'},
            {label: 'Sessions', align: 'right', width: '82px'},
            {label: 'Users', align: 'right', width: '65px'},
          ]}
          rows={data.referrers.map((r) => [
            <span
              key={r.referrer}
              title={r.referrer}
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 13,
              }}
            >
              {r.referrer}
            </span>,
            fNum(r.sessions),
            fNum(r.users),
          ])}
        />
      </Panel>
    </div>
  )
}
