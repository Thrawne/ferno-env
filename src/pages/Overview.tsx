import { useEffect, useState } from 'react'
import { TextMorph } from 'torph/react'
import { ArrowRight, Pencil, Plus, Sparkles, X, Zap, Users, Activity } from 'lucide-react'
import { LiveChart } from '../charts/LiveChart'
import { StackedBars } from '../charts/BarChart'
import { Funnel } from '../charts/Funnel'
import { fmtFull, fmt } from '../charts/common'
import { DEFAULT_FUNNEL, EVENT_SERIES, FUNNEL_EVENTS, INSIGHTS, RANGE_LABEL, funnelCounts, labelsFor, overview, rangeSpan, rangeDelta } from '../data'
import { Banner, Body, Kpi, PageHeader, PixelCorner, RangeSelect, Select, useApp } from '../components/ui'

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

export function Overview({ ask }: { ask: (q: string) => void }) {
  const { range, mode, loading } = useApp()
  const d = overview(range)
  const labels = labelsFor(range)
  const totalEvents = sum(Object.values(d.events).flat())
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState(false)
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); if (n.size === EVENT_SERIES.length) return h; return n })

  return (
    <div className="page fade-page">
      <PageHeader title="Overview" sub="See what changed, understand why, and move the right response forward." right={<RangeSelect />} />
      <div className="group">
        <Banner />
        <div className="grid g-kpi3">
          <Kpi icon={<Zap size={14} />} label="Total Events" value={totalEvents} format={(n) => fmtFull(Math.round(n))} delta={rangeDelta(12.4, range)} foot={rangeSpan(range)} spark={d.events.pageviews} />
          <Kpi icon={<Users size={14} />} label="Active Users" value={sum(d.active)} format={(n) => fmtFull(Math.round(n))} delta={rangeDelta(8.1, range)} foot={rangeSpan(range)} spark={d.active} sparkColor="var(--s2)" />
          <Kpi icon={<Activity size={14} />} label="Conversion" value={18.2} format={(n) => n.toFixed(1) + '%'} delta={rangeDelta(-2.1, range)} foot="Landing → Checkout" spark={d.events.signups} sparkColor="var(--s3)" />
        </div>

        <div className="grid g-2w">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Active Users</h3>
              <span className="card-sub">Hover to scrub · tap a chip to hide a line</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Body height={300} empty={{ title: 'No active users this period', sub: `No users were active in the ${RANGE_LABEL[range].toLowerCase()}. Try a longer period.` }}>
                <LiveChart key={range} height={300} labels={labels} series={[
                  { key: 'a', label: 'All active', color: '#d97706', values: d.active },
                  { key: 'r', label: 'Returning', color: '#2a78d6', values: d.returning },
                ]} />
              </Body>
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Event Activity</h3>
              {mode === 'filled' && !loading && (
                <div className="legend">
                  {EVENT_SERIES.map((s) => (
                    <button key={s.key} aria-pressed={!hidden.has(s.key)} onClick={() => toggle(s.key)}>
                      <i className="swatch" style={{ background: s.color }} />{s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <Body height={300} empty={{ title: 'No events in this period', sub: `No events were recorded in the ${RANGE_LABEL[range].toLowerCase()}. Try a longer period.`, icon: <EventsIcon /> }}>
                <StackedBars height={300} labels={labels} hidden={hidden}
                  series={EVENT_SERIES.map((s) => ({ ...s, values: d.events[s.key] }))} />
              </Body>
            </div>
          </div>
        </div>

        <div className={'grid' + (dismissed ? '' : ' g-side')}>
          <FunnelCard />
          {!dismissed && <Noticed onDismiss={() => setDismissed(true)} onOpen={ask} />}
        </div>
      </div>
    </div>
  )
}

function EventsIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden>
      <rect x="0" y="0" width="2" height="34" rx="1" fill="var(--accent-200)" />
      <rect x="6" y="7" width="22" height="8" rx="2" fill="var(--accent-300)" />
      <rect x="6" y="19" width="16" height="8" rx="2" fill="var(--accent-200)" />
    </svg>
  )
}

function FunnelCard() {
  const { range, mode, loading } = useApp()
  const [steps, setSteps] = useState<string[] | null>(DEFAULT_FUNNEL)
  const [draft, setDraft] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const showBuilder = mode === 'empty' || editing || !steps
  const counts = steps ? funnelCounts(steps, range) : []

  return (
    <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <div className="card-head">
        <h3 className="card-title">Conversion Funnel</h3>
        {!showBuilder && !loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="card-sub num"><TextMorph numbers>{`${fmt(counts[counts.length - 1].value)} converted · ${((counts[counts.length - 1].value / counts[0].value) * 100).toFixed(1)}%`}</TextMorph></span>
            <button className="btn" onClick={() => { setDraft(steps!); setEditing(true) }}><Pencil size={14} />Edit</button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, marginTop: 20, position: 'relative' }}>
        {loading ? <div style={{ position: 'absolute', inset: 0 }}><Body height={300} empty={{ title: '', sub: '' }}>{null}</Body></div>
        : showBuilder ? (
          <div className="empty" style={{ minHeight: 300 }}>
            <div style={{ maxWidth: 420 }}>
              <div className="empty-title">Build a conversion funnel</div>
              <div className="empty-sub">Choose 2–5 events in the order users should reach them.</div>
              {draft.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 16 }}>
                  {draft.map((s, i) => (
                    <span key={s} className="chip" style={{ animation: 'pop-in .2s cubic-bezier(.23,1,.32,1)' }}>
                      <b style={{ color: 'var(--accent-600)', fontWeight: 600 }}>{i + 1}</b>{s}
                      <button aria-label={`Remove ${s}`} onClick={() => setDraft(draft.filter((x) => x !== s))} style={{ border: 0, background: 'none', padding: 0, display: 'grid', color: 'var(--n-500)' }}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', marginTop: 16, justifyContent: 'center' }}>
                <div style={{ width: 220 }}>
                  <Select value={null} placeholder={draft.length >= 5 ? 'Max 5 steps' : 'Add a new event…'}
                    options={FUNNEL_EVENTS.filter((e) => !draft.includes(e)).map((e) => ({ value: e, label: e }))}
                    onChange={(v) => draft.length < 5 && setDraft([...draft, v])} />
                </div>
                <button className="btn btn-dark" style={{ marginLeft: -4, borderRadius: '0 8px 8px 0' }} disabled={draft.length < 2}
                  onClick={() => { setSteps(draft); setEditing(false) }}>
                  <Plus size={14} />Save Funnel
                </button>
              </div>
              {mode === 'empty' && <p className="card-sub" style={{ marginTop: 12 }}>Funnels fill in once events arrive.</p>}
            </div>
          </div>
        ) : (
          <Funnel steps={counts} height={320} />
        )}
      </div>
    </div>
  )
}

function Noticed({ onDismiss, onOpen }: { onDismiss: () => void; onOpen: (q: string) => void }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [p, setP] = useState(0)
  useEffect(() => {
    if (paused) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      setP((v) => {
        const nv = v + (t - last) / 7000
        if (nv >= 1) { setI((x) => (x + 1) % INSIGHTS.length); return 0 }
        return nv
      })
      last = t
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paused])
  const it = INSIGHTS[i]
  return (
    <div className="noticed" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="noticed-bars">
        {INSIGHTS.map((_, k) => (
          <button key={k} aria-label={`Insight ${k + 1}`} onClick={() => { setI(k); setP(0) }}>
            <span><i style={{ transform: `scaleX(${k < i ? 1 : k === i ? p : 0})` }} /></span>
          </button>
        ))}
      </div>
      <div>
        <div className="noticed-eyebrow"><Sparkles size={14} />Ferno noticed</div>
        {/* torph: the headline morphs into the next insight instead of swapping */}
        <TextMorph as="h3" className="noticed-title">{it.title}</TextMorph>
        <p key={i} className="noticed-body noticed-slide" style={{ margin: 0 }}>{it.body}</p>
      </div>
      <div className="noticed-actions">
        <button className="btn" style={{ color: 'var(--fg)' }} onClick={() => onOpen(it.q)}>Open report<ArrowRight size={14} /></button>
        <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={onDismiss}>Dismiss</button>
      </div>
      <PixelCorner cols={16} rows={7} size={14} color="#feceab" opacity={0.35} />
    </div>
  )
}
