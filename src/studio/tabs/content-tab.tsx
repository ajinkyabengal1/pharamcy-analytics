import React from 'react'
import type {AnalyticsData} from '../ga-types'
import {fNum, fPct, SECTION_INFO} from '../components/ga-constants'
import {Panel, DataTable, PathCell} from '../components/shared-ui'

export function ContentTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      <Panel title="Top Pages" info={SECTION_INFO['Top Pages']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Page Path'},
            {label: 'Views', align: 'right', width: '72px'},
            {label: 'Users', align: 'right', width: '62px'},
          ]}
          rows={data.topPages.map((p) => [
            <PathCell key={p.path} path={p.path} />,
            fNum(p.pageViews),
            fNum(p.users),
          ])}
        />
      </Panel>
      <Panel title="Top Landing Pages" info={SECTION_INFO['Top Landing Pages']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Landing Page'},
            {label: 'Sessions', align: 'right', width: '80px'},
            {label: 'Bounce', align: 'right', width: '68px'},
          ]}
          rows={data.landingPages.map((p) => [
            <PathCell key={p.path} path={p.path} />,
            fNum(p.sessions),
            fPct(p.bounceRate),
          ])}
        />
      </Panel>
    </div>
  )
}
