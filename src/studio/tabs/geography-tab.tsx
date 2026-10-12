import React from 'react'
import type {AnalyticsData} from '../ga-types'
import {fNum, SECTION_INFO} from '../components/ga-constants'
import {Panel, DataTable} from '../components/shared-ui'

export function GeographyTab({data, loading}: {data: AnalyticsData; loading?: boolean}) {
  return (
    <div
      style={{animation: 'ga-fadein .25s ease', display: 'flex', flexDirection: 'column', gap: 20}}
    >
      <Panel title="Top Countries" info={SECTION_INFO['Top Countries']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'Country'},
            {label: 'Users', align: 'right', width: '70px'},
            {label: 'Sessions', align: 'right', width: '78px'},
          ]}
          rows={data.countries.map((c) => [c.country, fNum(c.users), fNum(c.sessions)])}
        />
      </Panel>
      <Panel title="Top Cities" info={SECTION_INFO['Top Cities']}>
        <DataTable
          loading={loading}
          headers={[
            {label: 'City'},
            {label: 'Country', width: '110px'},
            {label: 'Users', align: 'right', width: '65px'},
            {label: 'Sessions', align: 'right', width: '75px'},
          ]}
          rows={data.cities.map((c) => [
            c.city,
            <span key={c.city} style={{fontSize: 12, color: '#94a3b8'}}>
              {c.country}
            </span>,
            fNum(c.users),
            fNum(c.sessions),
          ])}
        />
      </Panel>
    </div>
  )
}
