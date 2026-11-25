import { CardTitle } from '../components/Tip'
import { useState } from 'react'
import { Clock, Eye, FileText, Layers, LogOut, Megaphone, Monitor, MousePointer2, Repeat, RotateCcw, Smartphone, Tablet, Target, Users } from 'lucide-react'
import { LiveChart } from '../charts/LiveChart'
import { ShareBar } from '../charts/BarChart'
import { BarList, Donut, RetentionGrid } from '../charts/Misc'
import { fmtFull } from '../charts/common'
import { type SourceRow, PAGES, RANGE_LABEL, REGION, SOURCES, TECH, analytics, labelsFor, rangeSpan, retention, rangeDelta } from '../data'
import { Banner, Body, Kpi, PageHeader, RangeSelect, Seg, useApp } from '../components/ui'

const PALETTE = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)']

export function Analytics() {
  const { range } = useApp()
  const d = analytics(range)
  const labels = labelsFor(range)
  const emptySub = `No users were active in the ${RANGE_LABEL[range].toLowerCase()}. Try a longer period.`
  const empty = { title: 'No visits in this period', sub: emptySub }
  const [metric, setMetric] = useState<'Visitors' | 'Views' | 'Sessions'>('Visitors')
  const [pages, setPages] = useState('Top')
  const [src, setSrc] = useState('Sources')
  const [tech, setTech] = useState('Devices')
  const [region, setRegion] = useState('Timezones')
  const cur = metric === 'Visitors' ? d.visitors : metric === 'Views' ? d.views : d.sessions
  const ratio = cur.reduce((a, b) => a + b, 0) / d.visitors.reduce((a, b) => a + b, 0)
  const prev = d.prevVisitors.map((v) => Math.round(v * ratio))
  const span = rangeSpan(range)

  return (
    <div className="page fade-page">
      <PageHeader title="Analytics" sub="See who visits, where they come from, what they read, and whether they return." right={<RangeSelect />} />
      <div className="group">
        <Banner />
        <div className="grid g-kpi6">
          <Kpi icon={<Users size={14} />} label="Visitors" value={d.totals.visitors} format={(n) => fmtFull(Math.round(n))} delta={rangeDelta(14.2, range)} foot={span} />
          <Kpi icon={<Eye size={14} />} label="Page Views" value={d.totals.views} format={(n) => fmtFull(Math.round(n))} delta={rangeDelta(9.8, range)} foot={span} />
          <Kpi icon={<Layers size={14} />} label="Sessions" value={d.totals.sessions} format={(n) => fmtFull(Math.round(n))} delta={rangeDelta(11.0, range)} foot={span} />
          <Kpi icon={<LogOut size={14} />} label="Bounce Rate" lowerIsBetter value={d.totals.bounce} format={(n) => n.toFixed(1) + '%'} delta={rangeDelta(-3.2, range)} foot="Lower is better" />
          <Kpi icon={<Clock size={14} />} label="Avg. Session" value={d.totals.avgSession} format={(n) => `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`} delta={rangeDelta(4.6, range)} foot={span} />
          <Kpi icon={<FileText size={14} />} label="Pages / Session" value={d.totals.pps} format={(n) => n.toFixed(2)} delta={rangeDelta(0, range)} foot={span} />
        </div>

        <div className="card">
          <div className="card-head">
            <CardTitle tip="traffic">Traffic</CardTitle>
            <Seg value={metric} options={['Visitors', 'Views', 'Sessions']} onChange={setMetric} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Body height={320} empty={empty}>
              <LiveChart key={range} height={320} labels={labels} series={[
                { key: 'cur', label: `${metric} · this period`, color: '#d97706', values: cur },
                { key: 'prev', label: 'Previous period', color: '#a4a4a4', values: prev },
              ]} />
            </Body>
          </div>
        </div>

        <div className="section-label"><FileText size={14} />Pages &amp; Sources</div>
        <div className="grid g-2">
          <div className="card">
            <div className="card-head"><CardTitle tip="pages">Pages</CardTitle><Seg value={pages} options={['Top', 'Entry', 'Exit']} onChange={setPages} /></div>
            <Body height={300} empty={empty}>
              <BarList mono head={['Page', 'Visitors']} slots={6} rows={PAGES[pages].map(([p, v]) => ({ key: p, text: p, label: null, value: v }))} />
            </Body>
          </div>
          <div className="card">
            <div className="card-head"><CardTitle tip="sources">Sources</CardTitle><Seg value={src} options={['Sources', 'Campaigns']} onChange={setSrc} /></div>
            <Body height={300} empty={empty}>
              <BarList mono={src === 'Campaigns'} head={[src === 'Sources' ? 'Referrer' : 'Campaign', 'Visitors']} slots={6} rows={SOURCES[src].map((r) => ({
                key: r.name, text: r.name, label: null, value: r.value, icon: <SourceLogo row={r} />, iconKey: r.logo ?? r.icon,
              }))} />
            </Body>
          </div>
        </div>

        <div className="section-label"><Target size={14} />Audience</div>
        <div className="grid g-3">
          <div className="card">
            <div className="card-head"><CardTitle tip="newReturning">New vs. Returning</CardTitle></div>
            <Body height={300} empty={empty}>
              <NewReturning total={d.totals.visitors} />
            </Body>
          </div>
          <div className="card">
            <div className="card-head"><CardTitle tip="technology">Technology</CardTitle><Seg value={tech} options={['Devices', 'Browsers', 'Systems']} onChange={setTech} /></div>
            <Body height={300} empty={empty}>
              <ShareBar slots={5} items={TECH[tech].map(([l, v, logo], i) => ({ label: l, value: v, color: PALETTE[i], iconKey: logo || l, icon: logo ? <img className="logo" src={`/logos/${logo}.svg`} alt="" /> : <DeviceIcon kind={l} /> }))} />
            </Body>
          </div>
          <div className="card">
            <div className="card-head"><CardTitle tip="region">Region</CardTitle><Seg value={region} options={['Timezones', 'Languages']} onChange={setRegion} /></div>
            <Body height={300} empty={empty}>
              <BarList head={[region === 'Timezones' ? 'Timezone' : 'Language', 'Visitors']} slots={6} rows={REGION[region].map(([f, l, v]) => ({
                key: l, text: l, label: null, value: v, iconKey: f, icon: <span aria-hidden style={{ fontSize: 14 }}>{f}</span>,
              }))} />
            </Body>
          </div>
        </div>

        <div className="section-label"><RotateCcw size={14} />Retention</div>
        <div className="card">
          <div className="card-head">
            <CardTitle tip="retention">Weekly Retention</CardTitle>
            <span className="card-sub">Share of each weekly cohort that came back</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Body height={360} empty={empty}>
              <RetentionGrid rows={retention()} />
            </Body>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewReturning({ total }: { total: number }) {
  const ret = Math.round(total * 0.38)
  const items = [
    { label: 'New', value: total - ret, color: 'var(--s1)' },
    { label: 'Returning', value: ret, color: 'var(--s2)' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Donut items={items} size={176} center={
        <div><div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }} className="num">{fmtFull(total)}</div><div style={{ color: 'var(--muted)', fontSize: 12 }}>visitors</div></div>
      } />
      <div style={{ display: 'grid', gap: 14, minWidth: 130 }}>
        {items.map((it) => (
          <div key={it.label}>
            <div className="legend"><span><i className="swatch" style={{ background: it.color }} />{it.label}</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <span style={{ fontWeight: 500, fontSize: 18 }} className="num">{fmtFull(it.value)}</span>
              <span className="card-sub num">{((it.value / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
        <div className="card-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Repeat size={12} />Returning up 6.1% vs last period</div>
      </div>
    </div>
  )
}

function SourceLogo({ row }: { row: SourceRow }) {
  if (row.logo) return <span className="logo-tile"><img className="logo" src={`/logos/${row.logo}.svg`} alt="" /></span>
  return <span className="logo-tile">{row.icon === 'campaign' ? <Megaphone size={12} /> : <MousePointer2 size={12} />}</span>
}

function DeviceIcon({ kind }: { kind: string }) {
  const Icon = kind === 'Mobile' ? Smartphone : kind === 'Tablet' ? Tablet : Monitor
  return <Icon size={16} color="var(--n-600)" />
}
