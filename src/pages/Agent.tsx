import { useCallback, useEffect, useRef, useState } from 'react'
import { TextMorph } from 'torph/react'
import { ArrowUp, ArrowUpRight, Check, ChevronRight, History, Plus, Shuffle, Paperclip, FileText, Image } from 'lucide-react'
import { LiveChart } from '../charts/LiveChart'
import { StackedBars } from '../charts/BarChart'
import { Funnel } from '../charts/Funnel'
import { FernoMark, Popover, SidebarToggle, useApp } from '../components/ui'
import { RecentThumb } from '../components/RecentThumb'
import { RANGES, RANGE_LABEL, type Range } from '../data'
import { RECENT, SUGGESTION_SETS, answerFor, type ChartSpec } from './answers'

/* ───────── Composer ───────── */
export function Composer({ onSend, autoFocus }: { onSend: (q: string) => void; autoFocus?: boolean }) {
  const [v, setV] = useState('')
  const [range, setRange] = useState<Range>('7d')
  const [scope, setScope] = useState('All events')
  const [menu, setMenu] = useState<null | 'range' | 'scope' | 'add'>(null)
  const close = useCallback(() => setMenu(null), [])
  const addRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<HTMLDivElement>(null)
  const scopeRef = useRef<HTMLDivElement>(null)
  const send = () => { if (v.trim()) { onSend(v.trim()); setV('') } }
  return (
    <div className="composer">
      <div className="composer-box">
        <textarea value={v} autoFocus={autoFocus} placeholder="Ask about sign-ups, a page, or a release…" rows={2}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <div className="composer-row">
          <div className="select-wrap" ref={addRef}>
            <button className="chip round" aria-label="Add context" aria-expanded={menu === 'add'} onClick={() => setMenu(menu === 'add' ? null : 'add')}><Plus size={14} /></button>
            <Popover anchor={addRef} open={menu === 'add'} onClose={close} matchWidth={false} minWidth={180} label="Add context">
              <button className="menu-item" onClick={close}><FileText size={15} />Attach a report</button>
              <button className="menu-item" onClick={close}><Image size={15} />Add a screenshot</button>
              <button className="menu-item" onClick={close}><Paperclip size={15} />Upload a file</button>
            </Popover>
          </div>
          <div className="select-wrap" ref={rangeRef}>
            <button className="chip" aria-expanded={menu === 'range'} onClick={() => setMenu(menu === 'range' ? null : 'range')}><TextMorph>{RANGE_LABEL[range]}</TextMorph><ArrowUpRight size={12} /></button>
            <Popover anchor={rangeRef} open={menu === 'range'} onClose={close} matchWidth={false} minWidth={160} label="Date range">
              {RANGES.map((r) => <button key={r} className="menu-item" onClick={() => { setRange(r); close() }}>{RANGE_LABEL[r]}{r === range && <Check size={15} strokeWidth={2.5} className="check" />}</button>)}
            </Popover>
          </div>
          <div className="select-wrap" ref={scopeRef}>
            <button className="chip" aria-expanded={menu === 'scope'} onClick={() => setMenu(menu === 'scope' ? null : 'scope')}><TextMorph>{scope}</TextMorph><ArrowUpRight size={12} /></button>
            <Popover anchor={scopeRef} open={menu === 'scope'} onClose={close} matchWidth={false} minWidth={160} label="Events">
              {['All events', 'Sign-ups', 'Page views', 'Custom events'].map((x) => <button key={x} className="menu-item" onClick={() => { setScope(x); close() }}>{x}{x === scope && <Check size={15} strokeWidth={2.5} className="check" />}</button>)}
            </Popover>
          </div>
          <button className={'send-btn' + (v.trim() ? ' ready' : '')} aria-label="Send" onClick={send}><ArrowUp size={16} /></button>
        </div>
      </div>
      <div className="composer-hint">Press Enter to send and Shift + Enter for a new line</div>
    </div>
  )
}

/* ───────── Agent home ───────── */
export function AgentHome({ onAsk }: { onAsk: (q: string) => void }) {
  const { go, mode } = useApp()
  const [set, setSet] = useState(0)
  return (
    <div className="fade-page" style={{ minHeight: '100%', display: 'grid', alignContent: 'center', padding: '64px 0' }}>
      <div className="agent-wrap" style={{ width: '100%' }}>
        <div className="agent-head">
          <div className="title-row">
            <SidebarToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-600)' }}><FernoMark size={18} />Ferno agent</div>
          </div>
          <h1 className="page-title" style={{ marginTop: 8 }}>What should we look into, Alex?</h1>
        </div>
        <p className="page-sub" style={{ marginBottom: 24 }}>Ask a plain-language question. Ferno will answer directly or bring in the investigator.</p>
        <Composer onSend={onAsk} autoFocus />
        <div key={set} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {SUGGESTION_SETS[set].map((s, i) => (
            <button key={s} className="suggestion" onClick={() => onAsk(s)} style={{ animation: `chart-in .35s cubic-bezier(.23,1,.32,1) ${i * 50}ms both` }}>{s}<ArrowUpRight size={14} /></button>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setSet((s) => (s + 1) % SUGGESTION_SETS.length)}><Shuffle size={14} />Shuffle</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 12px' }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)' }}><History size={14} />Recent</span>
          <button className="btn btn-ghost" style={{ color: 'var(--accent-600)', height: 24, padding: '0 4px' }} onClick={() => go('reports')}>View all</button>
        </div>
        {mode === 'empty' ? (
          <p className="card-sub" style={{ fontSize: 14 }}>No investigations yet. Ask a question above to start one.</p>
        ) : <div className="recent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
          {RECENT.map((r, i) => (
            <a key={r.title} className="recent-card" href="#/chat" onClick={(e) => { e.preventDefault(); onAsk(r.q) }}>
              <RecentThumb kind={r.thumb} seed={i} />
              <span style={{ display: 'block', padding: '12px 14px', minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                <span className="card-sub" style={{ display: 'block', marginTop: 4 }}>{r.sub}</span>
                <span className="card-sub" style={{ display: 'block', marginTop: 6 }}>{r.time}</span>
              </span>
            </a>
          ))}
        </div>}
      </div>
    </div>
  )
}

/* ───────── Chat thread ───────── */
function scrollBottom(smooth: boolean) {
  const main = document.querySelector<HTMLElement>('.main')
  const behavior = smooth ? 'smooth' : 'auto'
  if (main && main.scrollHeight > main.clientHeight + 4 && getComputedStyle(main).overflowY !== 'visible') main.scrollTo({ top: main.scrollHeight, behavior })
  else window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
}

export type Msg = { id: number; q: string; time: string }

export function Chat({ msgs, onAsk }: { msgs: Msg[]; onAsk: (q: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollBottom(true)
  }, [msgs.length])
  return (
    <div className="fade-page" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={scroller} className="agent-wrap chat-scroll" style={{ width: '100%', flex: 1, paddingBottom: 40 }}>
        <div className="chat-head title-row">
          <SidebarToggle />
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-600)' }}><FernoMark size={18} />Ferno agent</span>
        </div>
        {msgs.map((m) => <Turn key={m.id} m={m} />)}
      </div>
      <div className="chat-dock">
        <div style={{ maxWidth: 712, margin: '0 auto' }}><Composer onSend={onAsk} autoFocus /></div>
      </div>
    </div>
  )
}

/** Answers already streamed once; revisiting the chat shows them settled instead of replaying. */
const played = new Set<number>()

function Turn({ m }: { m: Msg }) {
  const { mode } = useApp()
  const a = answerFor(m.q, mode === 'empty')
  const words = a.paras.map((p) => p.split(' '))
  const totalWords = words.reduce((s, w) => s + w.length, 0)
  const seen = played.has(m.id)
  const [phase, setPhase] = useState<'thinking' | 'writing' | 'done'>(seen ? 'done' : 'thinking')
  const [shown, setShown] = useState(seen ? Number.MAX_SAFE_INTEGER : 0)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (seen) return
    const t = setTimeout(() => setPhase('writing'), 1400)
    return () => clearTimeout(t)
  }, [seen])
  useEffect(() => { if (phase === 'done') played.add(m.id) }, [phase, m.id])
  useEffect(() => {
    if (phase !== 'writing') return
    // time-based so it keeps pace even if timers are throttled
    const start = Date.now()
    const id = setInterval(() => {
      const n = Math.floor(((Date.now() - start) / 1000) * 75)
      setShown(n)
      if (n >= totalWords) { clearInterval(id); setPhase('done') }
    }, 40)
    return () => clearInterval(id)
  }, [phase, totalWords])
  useEffect(() => {
    if (phase !== 'thinking') scrollBottom(false)
  }, [shown, phase])

  let budget = shown
  return (
    <div>
      <div className="msg-user">
        <div className="bubble">{m.q}</div>
        <div className="time">{m.time}</div>
      </div>
      <div className="msg-ai">
        <div className={'thinking' + (phase === 'thinking' ? ' live' : '')}>
          <FernoMark size={18} animate={phase === 'thinking'} />
          <TextMorph>{phase === 'thinking' ? 'Thinking…' : 'Thought for 6s'}</TextMorph>
        </div>
        {phase !== 'thinking' && (
          <button className="steps-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Ran {a.steps.length} {a.steps.length === 1 ? 'query' : 'queries'} <ChevronRight size={14} />
          </button>
        )}
        {open && <div className="steps-list">{a.steps.map((s) => <div key={s}>{s}</div>)}</div>}
        {phase !== 'thinking' && words.map((ws, pi) => {
          const take = Math.max(0, Math.min(ws.length, budget))
          budget -= ws.length
          if (take === 0) return null
          return <p key={pi}>{ws.slice(0, take).map((w, i) => <span key={i} className="word">{w} </span>)}</p>
        })}
        {phase === 'done' && a.chart && <ChartCard spec={a.chart} />}
      </div>
    </div>
  )
}

const HEX: Record<string, string> = { 'var(--s1)': '#d97706', 'var(--s2)': '#2a78d6', 'var(--s3)': '#1baf7a', 'var(--s4)': '#6250d6', 'var(--s5)': '#e87ba4' }

function ChartCard({ spec }: { spec: ChartSpec }) {
  const series = spec.type !== 'funnel' ? spec.series : []
  return (
    <div className="chart-card">
      <div className="chart-eyebrow">Chart</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '4px 0 16px', flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 500 }}>{spec.title}</div>
        {series.length > 1 && spec.type !== 'area' && (
          <div className="legend chips">{series.map((s) => <span key={s.key}><i className="swatch" style={{ background: s.color }} />{s.label}</span>)}</div>
        )}
      </div>
      {spec.type === 'bars' && <StackedBars height={260} labels={spec.labels} series={spec.series} />}
      {spec.type === 'area' && <LiveChart height={260} labels={spec.labels} series={spec.series.map((x) => ({ ...x, color: HEX[x.color] ?? x.color }))} />}
      {spec.type === 'funnel' && <Funnel height={260} steps={spec.steps} />}
    </div>
  )
}
