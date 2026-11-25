import { useMemo, useState } from 'react'
import { ArrowLeft, GitMerge, MessageSquareText, MousePointerClick, Search, Sparkles, SquareMousePointer, FileText, Zap } from 'lucide-react'
import { TextMorph } from 'torph/react'
import { Body, EmptyState, PageHeader, RangeSelect, Seg, useApp } from '../components/ui'
import { toast } from '../components/overlay'
import { Sparkline } from '../charts/AreaChart'
import { LiveChart } from '../charts/LiveChart'
import { BarList } from '../charts/Misc'
import { RANGE_LABEL, RANGE_SCALE, SMALL_BASE, fmtChange, labelsFor, pk, points, type Range } from '../data'

/**
 * Event explorer: every event the project sends, with its volume, people and
 * trend, and a detail page per event. Messy names ("Successfully Logged IN"
 * next to login_success) are grouped and can be merged, which the live app
 * can't do today.
 */
type Kind = 'page' | 'click' | 'custom' | 'auto'
type Ev = { name: string; kind: Kind; base: number; users: number; prev: number; seed: number }

const EVENTS: Ev[] = [
  { name: 'page_view', kind: 'page', base: 18420, users: 2941, prev: 16380, seed: 1 },
  { name: 'click', kind: 'click', base: 14210, users: 2210, prev: 13020, seed: 2 },
  { name: 'session_start', kind: 'auto', base: 3890, users: 2941, prev: 3510, seed: 3 },
  { name: 'signup_started', kind: 'custom', base: 612, users: 598, prev: 640, seed: 4 },
  { name: 'Signed up with Google', kind: 'custom', base: 402, users: 401, prev: 431, seed: 5 },
  { name: 'login_success', kind: 'custom', base: 1830, users: 912, prev: 1702, seed: 6 },
  { name: 'Successfully Logged IN', kind: 'custom', base: 214, users: 133, prev: 190, seed: 7 },
  { name: 'Login Success', kind: 'custom', base: 61, users: 40, prev: 55, seed: 8 },
  { name: 'export_clicked', kind: 'custom', base: 940, users: 311, prev: 702, seed: 9 },
  { name: 'invite_sent', kind: 'custom', base: 188, users: 96, prev: 161, seed: 10 },
  { name: 'rage_click', kind: 'auto', base: 312, users: 41, prev: 104, seed: 11 },
  { name: 'dead_click', kind: 'auto', base: 1148, users: 380, prev: 1090, seed: 12 },
  { name: 'checkout_completed', kind: 'custom', base: 96, users: 94, prev: 81, seed: 13 },
  { name: 'theme_exported', kind: 'custom', base: 6, users: 4, prev: 2, seed: 14 },
]
/** Names that are the same event spelled differently, and the one to keep. */
const ALIASES: { keep: string; drop: string[] }[] = [
  { keep: 'login_success', drop: ['Successfully Logged IN', 'Login Success'] },
]
const KIND_ICON: Record<Kind, typeof Zap> = { page: FileText, click: MousePointerClick, custom: Zap, auto: Sparkles }
const KIND_LABEL: Record<Kind, string> = { page: 'Page', click: 'Click', custom: 'Custom', auto: 'Automatic' }

/** A seeded trend line; it slopes the same way as the event's change. */
function spark(seed: number, n = 14, down = false) {
  let s = seed * 9301 + 49297
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  return Array.from({ length: n }, (_, i) => 40 + (down ? n - i : i) * 1.6 + r() * 18)
}
const count = (e: Ev, range: Range) => pk(e.base * RANGE_SCALE[range])
const users = (e: Ev, range: Range) => pk(e.users * Math.min(RANGE_SCALE[range], 2.6))
const prevCount = (e: Ev, range: Range) => pk(e.prev * RANGE_SCALE[range])

let merged = new Set<string>() // survives page changes in the session
export function Events() {
  const { range, mode, go, loading } = useApp()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<'All' | 'Custom' | 'Automatic'>('All')
  const [, force] = useState(0)
  const empty = mode === 'empty'
  const visible = EVENTS.filter((e) => !merged.has(e.name))
  const rows = visible
    .filter((e) => kind === 'All' || (kind === 'Custom' ? e.kind === 'custom' : e.kind !== 'custom'))
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    .map((e) => {
      // merged aliases add their volume to the name they were merged into
      const extra = ALIASES.find((a) => a.keep === e.name)?.drop.filter((d) => merged.has(d)).map((d) => EVENTS.find((x) => x.name === d)!) ?? []
      const all = [e, ...extra]
      const c = all.reduce((a, x) => a + count(x, range), 0)
      const p = all.reduce((a, x) => a + prevCount(x, range), 0)
      return { e, c, p, u: all.reduce((a, x) => a + users(x, range), 0) }
    })
    .sort((a, b) => b.c - a.c)
  const pending = ALIASES.filter((a) => a.drop.some((d) => !merged.has(d)))

  const merge = (a: (typeof ALIASES)[number]) => {
    const before = new Set(merged)
    a.drop.forEach((d) => merged.add(d))
    force((x) => x + 1)
    toast(<>Merged {a.drop.length} names into <span className="mono">{a.keep}</span></>, { label: 'Undo', run: () => { merged = before; force((x) => x + 1) } })
  }

  return (
    <div className="page fade-page">
      <PageHeader title="Events" count={empty ? 0 : visible.length} sub="Everything your product sends: how often, by how many people, and which way it's heading." right={<RangeSelect />} />
      <div className="group">
        {!empty && !loading && pending.map((a) => (
          <div key={a.keep} className="group-banner name-warn">
            <GitMerge size={16} />
            <span><b>{a.drop.length + 1} names look like one event:</b> <span className="mono">{a.keep}</span>, {a.drop.filter((d) => !merged.has(d)).map((d) => <span key={d} className="mono">“{d}”</span>).reduce<React.ReactNode[]>((acc, x, i) => (i ? [...acc, ', ', x] : [x]), [])}</span>
            <button className="btn" onClick={() => merge(a)}>Merge into {a.keep}</button>
          </div>
        ))}
        <div className="card" style={{ padding: 0 }}>
          <div className="list-search">
            <Search size={15} /><input placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
            <Seg value={kind} options={['All', 'Custom', 'Automatic']} onChange={setKind} />
          </div>
          <Body height={420} empty={{ title: 'No events yet', sub: 'Install the script and events show up here within a minute.' }}>
            {rows.length === 0 ? <div style={{ height: 240 }}><EmptyState title="No events match" sub="Try another name, or switch the filter to All." /></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl tbl-click">
                  <thead><tr><th>Event</th><th className="r">Count</th><th className="r">People</th><th className="r hide-sm">Per person</th><th className="hide-sm">Trend</th><th className="r">Change</th></tr></thead>
                  <tbody>
                    {rows.map(({ e, c, p, u }) => {
                      const Icon = KIND_ICON[e.kind]
                      const up = c >= p
                      const bad = ['rage_click', 'dead_click'].includes(e.name)
                      return (
                        <tr key={e.name} tabIndex={0} onClick={() => go('event/' + encodeURIComponent(e.name))} onKeyDown={(k) => k.key === 'Enter' && go('event/' + encodeURIComponent(e.name))}>
                          <td><span className="ev-name"><span className="ev-ico" title={KIND_LABEL[e.kind]}><Icon size={13} /></span><span className="mono">{e.name}</span></span></td>
                          <td className="r num"><TextMorph numbers>{c.toLocaleString('en-US')}</TextMorph></td>
                          <td className="r num"><TextMorph numbers>{u.toLocaleString('en-US')}</TextMorph></td>
                          <td className="r num hide-sm">{u ? (c / u).toFixed(1) : '–'}</td>
                          <td className="hide-sm" style={{ width: 120 }}><Sparkline values={spark(e.seed, 14, c < p)} height={26} color={bad ? '#dc2626' : '#d97706'} /></td>
                          <td className="r"><span className={'pill ' + (c === p ? 'flat' : (up !== bad) ? 'up' : 'down')} title={p < SMALL_BASE ? 'Too few last period for a percentage' : undefined}>{up ? '↑' : '↓'}{p < SMALL_BASE ? (up ? '+' : '−') : ''}{fmtChange(p, c)}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Body>
        </div>
      </div>
    </div>
  )
}

/* ───────── Event detail ───────── */
const BREAKDOWN: Record<string, [string, number, boolean?][]> = {
  Path: [['/', 41], ['/pricing', 22], ['/signup', 14], ['/docs', 11], ['/app', 8], ['/changelog', 4]],
  Browser: [['Chrome', 58], ['Safari', 25], ['Arc', 8], ['Firefox', 6], ['Edge', 3]],
  Country: [['Nigeria', 29], ['United Kingdom', 22], ['United States', 19], ['India', 11], ['Germany', 9], ['Other', 10]],
}
const RECENT_AT = ['14:02:11', '14:01:48', '13:58:30', '13:57:02', '13:51:44', '13:49:19']

export function EventDetail({ name }: { name: string }) {
  const { range, go, mode, loading } = useApp()
  const [by, setBy] = useState<'Path' | 'Browser' | 'Country'>('Path')
  const e = EVENTS.find((x) => x.name === name)
  const labels = labelsFor(range)
  const values = useMemo(() => {
    if (!e) return []
    const n = points(range), total = count(e, range)
    const w = spark(e.seed + n, n, count(e, range) < prevCount(e, range))
    const sum = w.reduce((a, b) => a + b, 0)
    return w.map((v) => Math.round((v / sum) * total))
  }, [e, range])
  if (!e) {
    return (
      <div className="page fade-page">
        <PageHeader title="Event not found" sub="It may have been merged or renamed." />
        <div className="group"><div className="card" style={{ height: 300 }}><EmptyState title="No such event" sub="Go back to Events to pick another." /></div></div>
      </div>
    )
  }
  const c = count(e, range), u = users(e, range), p = prevCount(e, range)
  const Icon = KIND_ICON[e.kind]
  const alias = ALIASES.find((a) => a.drop.includes(e.name))
  return (
    <div className="page fade-page">
      <div className="rp-crumbs"><a href="#/events" onClick={(x) => { x.preventDefault(); go('events') }}><ArrowLeft size={14} />Events</a></div>
      <div className="page-header">
        <div>
          <h1 className="page-title mono ev-title"><span className="ev-ico big"><Icon size={16} /></span>{e.name}</h1>
          <p className="page-sub">{KIND_LABEL[e.kind]} event · {RANGE_LABEL[range]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => go('agent')}><MessageSquareText size={14} />Ask Ferno about it</button>
          <RangeSelect />
        </div>
      </div>
      <div className="group">
        {alias && <div className="group-banner name-warn"><GitMerge size={16} /><span>This looks like <span className="mono">{alias.keep}</span> spelled differently. Merge it from the Events list.</span></div>}
        <div className="grid g-kpi3">
          <Stat label="Count" v={c} />
          <Stat label="People" v={u} />
          <div className="card kpi"><div className="kpi-label"><SquareMousePointer size={14} />Change</div>
            <div className="kpi-value num"><TextMorph numbers>{(c >= p ? '↑' : '↓') + (p < SMALL_BASE ? (c >= p ? '+' : '−') : '') + fmtChange(p, c)}</TextMorph></div>
            <div className="kpi-foot mono">vs. previous period{p < SMALL_BASE ? ' · small baseline' : ''}</div></div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">Over time</h3></div>
          <div style={{ marginTop: 16 }}>
            <Body height={260} empty={{ title: 'No occurrences this period', sub: 'Try a longer period.' }}>
              <LiveChart key={range} height={260} labels={labels} series={[{ key: 'c', label: e.name, color: '#d97706', values }]} />
            </Body>
          </div>
        </div>
        <div className="grid g-2">
          <div className="card">
            <div className="card-head"><h3 className="card-title">Breakdown</h3><Seg value={by} options={['Path', 'Browser', 'Country']} onChange={setBy} /></div>
            <Body height={280} empty={{ title: 'Nothing to break down', sub: 'Properties appear once the event fires.' }}>
              <BarList mono={by === 'Path'} head={[by, 'Share']} slots={6} rows={BREAKDOWN[by].map(([l, v]) => ({ key: l, text: l, label: null, value: Math.round((c * v) / 100) }))} />
            </Body>
          </div>
          <div className="card">
            <div className="card-head"><h3 className="card-title">Latest</h3><span className="card-sub">Most recent first</span></div>
            {mode === 'empty' || loading ? <div style={{ height: 280 }}><EmptyState title="Nothing yet" sub="The newest occurrences show here." /></div> : (
              <table className="tbl tbl-tight">
                <tbody>
                  {RECENT_AT.map((t, i) => (
                    <tr key={t}><td className="mono muted">{t}</td><td className="mono">anon_{(7310 + i * 977).toString(16)}</td><td className="mono muted">{BREAKDOWN.Path[i % 5][0]}</td><td className="muted">{BREAKDOWN.Browser[i % 4][0]}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="card kpi">
      <div className="kpi-label"><Zap size={14} />{label}</div>
      <div className="kpi-value num"><TextMorph numbers className="kpi-num">{v.toLocaleString('en-US')}</TextMorph></div>
      <div className="kpi-foot mono">this period</div>
    </div>
  )
}
