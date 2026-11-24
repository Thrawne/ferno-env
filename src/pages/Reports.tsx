import { useCallback, useMemo, useRef, useState } from 'react'
import { TextMorph } from 'torph/react'
import { AlertCircle, ArrowDownUp, ArrowLeft, ChevronRight, Info, ListFilter, Loader2, MessageSquareText, Radar, RotateCcw, Share2, Check } from 'lucide-react'
import { EmptyState, FernoMark, PageHeader, PixelCorner, Popover, useApp } from '../components/ui'
import { LiveChart } from '../charts/LiveChart'
import { MIN_USERS, pct, retry, useReports, type Report } from '../reports'

/* ───────── shared bits ───────── */
const VERDICT: Record<Report['verdict'], { label: string; tone: string }> = {
  findings: { label: 'Findings ready', tone: 'good' },
  insufficient: { label: 'Not enough data', tone: 'warn' },
  'no-change': { label: 'No real change', tone: 'flat' },
}
const IMPACT = { high: { label: 'High impact', w: 0.9 }, medium: { label: 'Medium impact', w: 0.55 }, low: { label: 'Low impact', w: 0.25 } }

function StatusChip({ r }: { r: Report }) {
  if (r.status === 'running') return <span className="rp-status running"><Loader2 size={12} className="spin" />Investigating</span>
  if (r.status === 'failed') return <span className="rp-status failed"><AlertCircle size={12} />Failed</span>
  return <span className="rp-status done"><Check size={12} strokeWidth={2.5} />Completed</span>
}

function SourceChip({ r }: { r: Report }) {
  return r.source === 'chat'
    ? <span className="rp-chip"><FernoMark size={13} />Asked in chat</span>
    : <span className="rp-chip"><Radar size={13} color="var(--s2)" />Automatic</span>
}

function Change({ r, big }: { r: Report; big?: boolean }) {
  const p = pct(r)
  const up = p >= 0
  // friction events are bad when they rise; everything else is good when it rises
  const higherIsBetter = !['dead_click', 'rage_click', 'exception'].includes(r.event)
  const good = up === higherIsBetter
  return (
    <span className={'rp-change ' + (good ? 'good' : 'bad') + (big ? ' big' : '')}>
      {up ? '↑' : '↓'} <TextMorph numbers>{`${Math.abs(p).toFixed(1)}%`}</TextMorph>
    </span>
  )
}

/* ───────── list ───────── */
type SortKey = 'newest' | 'change' | 'impact'
const SORTS: { k: SortKey; label: string }[] = [{ k: 'newest', label: 'Newest' }, { k: 'change', label: 'Biggest change' }, { k: 'impact', label: 'Impact' }]
const STATUSES: Report['status'][] = ['completed', 'running', 'failed']

export function Reports() {
  const { mode, loading, go } = useApp()
  const all = useReports()
  const [sort, setSort] = useState<SortKey>('newest')
  const [show, setShow] = useState<Set<Report['status']>>(new Set(STATUSES))
  const [menu, setMenu] = useState<null | 'sort' | 'filter'>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setMenu(null), [])

  const list = useMemo(() => {
    const rank = (r: Report) => (r.impact === 'high' ? 3 : r.impact === 'medium' ? 2 : r.impact === 'low' ? 1 : 0)
    const l = all.filter((r) => show.has(r.status))
    if (sort === 'change') return [...l].sort((a, b) => Math.abs(pct(b)) - Math.abs(pct(a)))
    if (sort === 'impact') return [...l].sort((a, b) => rank(b) - rank(a))
    return l
  }, [all, sort, show])

  const toggle = (s: Report['status']) => setShow((cur) => {
    const n = new Set(cur)
    if (n.has(s) && n.size > 1) n.delete(s); else n.add(s)
    return n
  })

  const controls = (
    <div style={{ display: 'flex', gap: 8 }}>
      <div className="select-wrap" ref={sortRef}>
        <button className="btn" aria-expanded={menu === 'sort'} onClick={() => setMenu(menu === 'sort' ? null : 'sort')}>
          <ArrowDownUp size={14} /><TextMorph>{SORTS.find((s) => s.k === sort)!.label}</TextMorph>
        </button>
        <Popover anchor={sortRef} open={menu === 'sort'} onClose={close} align="end" matchWidth={false} minWidth={180} label="Sort reports">
          <div className="menu-label">Sort by</div>
          {SORTS.map((s) => (
            <button key={s.k} className="menu-item" onClick={() => { setSort(s.k); close() }}>
              {s.label}{sort === s.k && <Check size={15} strokeWidth={2.5} className="check" />}
            </button>
          ))}
        </Popover>
      </div>
      <div className="select-wrap" ref={filterRef}>
        <button className="btn" aria-expanded={menu === 'filter'} onClick={() => setMenu(menu === 'filter' ? null : 'filter')}>
          <ListFilter size={14} />Filter{show.size < STATUSES.length && <span className="rp-count num">{show.size}</span>}
        </button>
        <Popover anchor={filterRef} open={menu === 'filter'} onClose={close} align="end" matchWidth={false} minWidth={200} label="Filter reports">
          <div className="menu-label">Status</div>
          {STATUSES.map((s) => (
            <button key={s} className="menu-item" onClick={() => toggle(s)} role="menuitemcheckbox" aria-checked={show.has(s)}>
              <span className={'rp-box' + (show.has(s) ? ' on' : '')}>{show.has(s) && <Check size={11} strokeWidth={3} />}</span>
              {s === 'completed' ? 'Completed' : s === 'running' ? 'Investigating' : 'Failed'}
              <span className="num" style={{ marginLeft: 'auto', color: 'var(--subtle)', fontSize: 12 }}>{all.filter((r) => r.status === s).length}</span>
            </button>
          ))}
        </Popover>
      </div>
    </div>
  )

  return (
    <div className="page fade-page">
      <PageHeader title="Reports" count={loading ? undefined : mode === 'empty' ? 0 : list.length} sub="Review investigation findings, recommendations, and the evidence behind them." right={controls} />
      <div className="group rp-list">
        {loading ? Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rp-row" style={{ cursor: 'default' }}>
            <div className="rp-main">
              <div className="shimmer" style={{ height: 22, width: 220 }} />
              <div className="shimmer" style={{ height: 18, width: '70%', marginTop: 16 }} />
              <div className="shimmer" style={{ height: 14, width: '90%', marginTop: 10 }} />
              <div className="shimmer" style={{ height: 30, width: 280, marginTop: 16 }} />
            </div>
          </div>
        )) : mode === 'empty' ? (
          <div className="card" style={{ position: 'relative', minHeight: 360 }}>
            <EmptyState title="No reports yet" sub="When Ferno spots a change worth explaining, or you ask it a question, the investigation lands here." />
            <PixelCorner cols={22} rows={8} size={14} opacity={0.35} />
          </div>
        ) : list.map((r, i) => (
          <button key={r.id} className="rp-row" onClick={() => go(`report/${r.id}`)} style={{ animationDelay: `${i * 40}ms` }}>
            <div className="rp-main">
              <div className="rp-top">
                <SourceChip r={r} />
                <span className="rp-target mono">{r.event} · {r.page}</span>
                <span className="rp-date">{r.created}</span>
              </div>
              <div className="rp-title">{r.title}</div>
              <p className="rp-summary">{r.summary}</p>
              <div className="rp-foot">
                <span className="rp-perf">
                  <span className="rp-perf-label">Change</span>
                  <Change r={r} />
                  <span className="rp-perf-sep" />
                  <span className="mono rp-from">{r.from} → {r.to} {r.unit}</span>
                </span>
                <span className={'rp-verdict ' + (r.status === 'completed' ? VERDICT[r.verdict].tone : 'muted')}>
                  {r.status === 'completed' ? VERDICT[r.verdict].label : r.status === 'running' ? 'In progress' : 'No result'}
                </span>
                {r.impact && (
                  <span className="rp-impact" title={IMPACT[r.impact].label}>
                    <span className="rp-meter"><i style={{ width: `${IMPACT[r.impact].w * 100}%` }} /></span>{IMPACT[r.impact].label}
                  </span>
                )}
                <StatusChip r={r} />
              </div>
            </div>
            <ChevronRight size={18} className="rp-chev" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────── detail ───────── */
export function ReportDetail({ id }: { id: string }) {
  const { go } = useApp()
  const r = useReports().find((x) => x.id === id)
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)
  if (!r) {
    return (
      <div className="page fade-page">
        <button className="btn btn-ghost rp-back" onClick={() => go('reports')}><ArrowLeft size={14} />Reports</button>
        <EmptyState title="Report not found" sub="It may have been removed." />
      </div>
    )
  }
  const usersOk = r.users.current >= MIN_USERS && r.users.base >= MIN_USERS
  const share = () => {
    try { navigator.clipboard?.writeText(location.href) } catch { /* clipboard blocked */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="page fade-page">
      <div className="rp-crumbs">
        <button className="btn btn-ghost rp-back" onClick={() => go('reports')}><ArrowLeft size={14} />Reports</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {r.question && <button className="btn" onClick={() => go('agent')}><MessageSquareText size={14} />Ask a follow-up</button>}
          <button className="btn" onClick={share}><Share2 size={14} /><TextMorph>{copied ? 'Link copied' : 'Share'}</TextMorph></button>
        </div>
      </div>

      <h1 className="page-title rp-h1">{r.title}</h1>
      <div className="rp-badges">
        {r.status === 'completed' && <span className={'rp-verdict ' + VERDICT[r.verdict].tone}>{VERDICT[r.verdict].label}</span>}
        <StatusChip r={r} />
        <span className="rp-chip">{r.impact ? IMPACT[r.impact].label : 'Not scored'}</span>
        <span className="rp-chip mono" style={{ fontSize: 12 }}>Data through {r.dataThrough}</span>
      </div>

      <div className="group rp-detail">
        <div className="rp-col">
          {r.status === 'failed' && (
            <section className="card rp-sec rp-error">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="var(--danger-ink)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Investigation couldn’t finish</div>
                  <p className="rp-p" style={{ marginTop: 4 }}>{r.error}</p>
                  <button className="btn btn-dark" style={{ marginTop: 12 }} onClick={() => retry(r.id)}><RotateCcw size={14} />Run again</button>
                </div>
              </div>
            </section>
          )}

          {r.status === 'running' && (
            <section className="card rp-sec">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FernoMark size={18} animate />
                <TextMorph className="rp-running">{`Investigating · step ${r.evidence.length + 1} of 4`}</TextMorph>
              </div>
              <div className="rp-progress"><i style={{ width: `${((r.evidence.length + 0.5) / 4) * 100}%` }} /></div>
            </section>
          )}

          {r.status === 'completed' && (
            <section className="card rp-sec">
              <div className="rp-h2">{r.verdict === 'findings' ? 'What Ferno found' : 'Summary'}</div>
              <p className="rp-p">{r.summary}</p>
              {r.findings.length > 0 && <ul className="rp-ul">{r.findings.map((f) => <li key={f}>{f}</li>)}</ul>}
            </section>
          )}

          {r.chart && r.status === 'completed' && (
            <section className="card rp-sec">
              <div className="rp-h2">{r.event} · {r.page}</div>
              <div style={{ marginTop: 12 }}>
                <LiveChart height={240} labels={r.chart.labels} series={[
                  { key: 'cur', label: 'Current window', color: '#d97706', values: r.chart.current },
                  { key: 'base', label: 'Baseline', color: '#a4a4a4', values: r.chart.base },
                ]} />
              </div>
            </section>
          )}

          {r.recommendations.length > 0 && (
            <section className="card rp-sec">
              <div className="rp-h2">Recommended next steps</div>
              <ol className="rp-ol">{r.recommendations.map((x) => <li key={x}>{x}</li>)}</ol>
            </section>
          )}

          {r.uncertainties && (
            <section className="card rp-sec">
              <div className="rp-h2"><Info size={14} color="var(--n-500)" />Uncertainties</div>
              <p className="rp-p">{r.uncertainties}</p>
            </section>
          )}

          <section className="card rp-sec">
            <div className="rp-h2">Evidence trail</div>
            {r.evidence.length === 0 ? (
              <p className="rp-p" style={{ color: 'var(--subtle)' }}>{r.status === 'running' ? 'Queries will appear here as Ferno runs them.' : 'No queries were run for this report.'}</p>
            ) : (
              <ol className="rp-steps">
                {r.evidence.map((e, i) => (
                  <li key={i} className="rp-step" style={{ animationDelay: `${i * 40}ms` }}>
                    <button className="rp-step-head" aria-expanded={open.has(i)} onClick={() => setOpen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })}>
                      <span className="rp-step-n num">{i + 1}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span style={{ fontWeight: 500 }}>{e.tool}</span>
                        <span className="card-sub" style={{ display: 'block' }}>Queried {e.at}</span>
                      </span>
                      <ChevronRight size={14} className="rp-step-chev" />
                    </button>
                    <div className="rp-step-body" data-open={open.has(i)}>
                      <div>
                        <div className="rp-code"><span className="rp-code-k">query</span>{e.query}</div>
                        <div className="rp-code"><span className="rp-code-k">result</span>{e.result}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="rp-side">
          <section className="card rp-sec">
            <div className="eyebrow">Investigated lead</div>
            <div className="rp-lead">
              <span className="mono" style={{ fontSize: 13 }}>{r.event}</span>
              <Change r={r} big />
            </div>
            <div className="rp-kv"><span>Rate</span><span className="mono">{r.from} → {r.to} {r.unit}</span></div>
            <div className="rp-kv"><span>z-score</span><span className="mono">{r.z.toFixed(2)}</span></div>
            <div className="rp-kv"><span>Page</span><span className="mono">{r.page}</span></div>
            <div className="rp-kv"><span>Source</span><span>{r.source === 'chat' ? 'Asked in chat' : 'Automatic'}</span></div>
            <div className="rp-kv"><span>Window</span><span>{r.window}</span></div>
            {r.question && <div className="rp-q">“{r.question}”</div>}
          </section>
          <section className="card rp-sec">
            <div className="eyebrow">Sample size</div>
            <p className="rp-p" style={{ marginTop: 6 }}>Unique users in each window. Findings need at least {MIN_USERS}.</p>
            {(['base', 'current'] as const).map((k) => {
              const n = r.users[k]
              const ok = n >= MIN_USERS
              const w = Math.min(1, n / Math.max(MIN_USERS * 2, r.users.base, r.users.current))
              return (
                <div key={k} className="rp-sample">
                  <div className="rp-kv" style={{ marginTop: 10 }}><span>{k === 'base' ? 'Baseline' : 'Current'}</span><span className="num" style={{ color: ok ? 'var(--fg)' : 'var(--danger-ink)' }}>{n.toLocaleString('en-US')}</span></div>
                  <div className="rp-bar"><i style={{ width: `${w * 100}%`, background: ok ? 'var(--s1)' : 'var(--n-300)' }} /><b style={{ left: `${(MIN_USERS / Math.max(MIN_USERS * 2, r.users.base, r.users.current)) * 100}%` }} /></div>
                </div>
              )
            })}
            <p className="card-sub" style={{ marginTop: 10 }}>{usersOk ? 'Both windows clear the minimum.' : 'At least one window is under the minimum.'}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
