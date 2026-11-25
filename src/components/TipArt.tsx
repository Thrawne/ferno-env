import { useEffect, useRef, type ReactNode } from 'react'
import { Check, ChevronsUpDown, Loader2, Send, Users } from 'lucide-react'
import { TextMorph } from 'torph/react'
import { GlimmScope, type GlimmScopeHandle } from 'glimm/react'
import { accentPair } from 'glimm'
import { Bar, Chart, Stage, chartPoints, type Act } from '../kit'
import { LiveChart } from '../charts/LiveChart'

/**
 * Tip illustrations (Figma: Ferno · Tooltip, 230:35347): a close-up.
 *
 * Each one is a crop of the screen the tip points at, drawn about 1.2× true
 * size on the page's own grey ground: one white card, its top-left corner in
 * view so it reads as part of the app, running off the bottom (and right,
 * where the right edge isn't the point). No stacked or tilted cards.
 *
 * The crop then does what the feature does, the cursor (stageshow's large
 * style, to match the zoom) pressing the real control where there is one:
 *   - torph: numbers, labels and statuses that change in place
 *   - Liveline: the line that morphs when the period changes
 *   - stageshow: the stage, cursor, script and kit chart
 *   - glimm: the empty → filled sweep, on the Data switch only
 * Designed at 360 × 200 and scaled to fit; under reduced motion each holds
 * its poster frame (the payoff).
 */
export type ArtKind = 'kpi' | 'range' | 'scrub' | 'bars' | 'fill' | 'funnel' | 'agent' | 'heat' | 'report' | 'list' | 'retention' | 'donut'
export type ListSet = 'pages' | 'sources' | 'tech' | 'region'

const W = 360, H = 200
type Pt = { x: number; y: number }

function Close<S extends object>({ initial, poster, script, cursor, children }: {
  initial: S; poster: S; script: (a: Act<S>) => Promise<void>; cursor?: Pt; children: (s: S) => ReactNode
}) {
  return (
    <Stage width={W} height={H} initial={initial} poster={poster} script={script} play="loop" unframed className="cx" accent="#d97706"
      cursor={cursor ? { at: cursor, style: 'large' } : undefined}>
      {(s) => <div className="cx-ground">{children(s)}</div>}
    </Stage>
  )
}

export function TipArt({ kind, label, set }: { kind: ArtKind; label: string; set?: ListSet }) {
  return <div className="tip-art" aria-hidden><Scene kind={kind} label={label} set={set} /></div>
}

function Scene({ kind, label, set }: { kind: ArtKind; label: string; set?: ListSet }) {
  switch (kind) {
    case 'kpi': return <KpiScene />
    case 'range': return <RangeScene />
    case 'scrub': return <ScrubScene label={label} />
    case 'bars': return <BarsScene />
    case 'fill': return <FillScene />
    case 'funnel': return <FunnelScene />
    case 'agent': return <AgentScene />
    case 'heat': return <HeatScene />
    case 'report': return <ReportScene />
    case 'list': return <ListScene set={set ?? 'pages'} label={label} />
    case 'retention': return <RetentionScene />
    case 'donut': return <DonutScene />
  }
}

/* ── KPI tile: the period changes and the number, change and dates morph together ── */
const KP = [
  { v: '2,569', d: '8.1%', up: true, f: 'Nov 18 – Nov 24', s: [18, 20, 19, 24, 22, 28, 26, 31, 30, 34] },
  { v: '10,842', d: '12.6%', up: true, f: 'Oct 26 – Nov 24', s: [12, 15, 14, 19, 23, 22, 27, 30, 33, 38] },
  { v: '31,206', d: '3.4%', up: false, f: 'Aug 27 – Nov 24', s: [30, 34, 31, 29, 33, 30, 27, 29, 26, 27] },
]
type KS = { p: 0 | 1 | 2 }
async function kpiScript(a: Act<KS>) {
  await a.wait(2000); await a.set({ p: 1 })
  await a.wait(2200); await a.set({ p: 2 })
  await a.wait(2200); await a.set({ p: 0 })
}
function KpiScene() {
  return (
    <Close<KS> initial={{ p: 0 }} poster={{ p: 1 }} script={kpiScript}>
      {(s) => {
        const k = KP[s.p]
        return (
          <div className="cx-card" style={{ left: 20, top: 20, width: 400, height: 220 }}>
            <div className="cx-kpi-l"><Users size={15} />Active Users</div>
            <div className="cx-kpi-v num">
              <TextMorph numbers>{k.v}</TextMorph>
              <span className={'pill ' + (k.up ? 'up' : 'down')}>{k.up ? '↑' : '↓'}<TextMorph numbers>{k.d}</TextMorph></span>
            </div>
            <div className="cx-kpi-f mono"><TextMorph>{k.f}</TextMorph></div>
            <Chart kind="line" data={k.s} width={400} height={60} max={40} area show className="cx-spark" />
          </div>
        )
      }}
    </Close>
  )
}

/* ── Date range: pick a longer period, the chart morphs to it (Liveline) ── */
const RANGE_LINES = {
  '7': [22, 26, 24, 30, 34, 31, 38, 36, 42, 40, 47, 45, 52, 50],
  '30': [30, 34, 29, 41, 38, 46, 43, 51, 48, 57, 54, 60, 66, 63],
}
const DAYS = Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`)
type RS = { open: boolean; r: '7' | '30' }
async function rangeScript(a: Act<RS>) {
  await a.wait(800)
  await a.click({ at: 'sel' }); await a.set({ open: true })
  await a.wait(350)
  await a.click({ at: 'o30' }); await a.set({ open: false, r: '30' })
  await a.move({ x: 250, y: 168 })
  await a.wait(2600)
  await a.click({ at: 'sel' }); await a.set({ open: true })
  await a.wait(300)
  await a.click({ at: 'o7' }); await a.set({ open: false, r: '7' })
  await a.move({ x: 250, y: 168 })
  await a.wait(1800)
}
function RangeScene() {
  return (
    <Close<RS> initial={{ open: false, r: '7' }} poster={{ open: false, r: '30' }} script={rangeScript} cursor={{ x: 250, y: 168 }}>
      {(s) => (
        <>
          <div className="cx-title" style={{ left: 20, top: 22 }}>Overview</div>
          <button className="cx-select" data-target="sel" data-cursor="pointer" style={{ right: 20, top: 18 }}>
            <TextMorph>{s.r === '7' ? 'Last 7 days' : 'Last 30 days'}</TextMorph><ChevronsUpDown size={15} />
          </button>
          <div className="cx-card" style={{ left: 20, top: 66, width: 400, height: 170, padding: '14px 0 0' }}>
            <div style={{ width: 330 }}>
              <LiveChart mini height={112} labels={DAYS} series={[{ key: 'a', label: 'Active', color: '#d97706', values: RANGE_LINES[s.r] }]} />
            </div>
          </div>
          <div className="cx-menu" data-open={s.open} style={{ right: 20, top: 58 }}>
            {(['24h', '7', '30'] as const).map((o) => (
              <div key={o} className="cx-mi" data-target={o === '24h' ? undefined : 'o' + o} data-cursor="pointer">
                {o === '24h' ? 'Last 24 hours' : `Last ${o} days`}{s.r === o && <Check size={15} />}
              </div>
            ))}
          </div>
        </>
      )}
    </Close>
  )
}

/* ── Line chart: scrub along it, the readout follows the pointer ── */
const SCRUB = [22, 26, 24, 30, 34, 31, 38, 36, 42, 40, 47, 52]
const SCRUB_DAYS = ['Nov 13', 'Nov 14', 'Nov 15', 'Nov 16', 'Nov 17', 'Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24']
const SC = { x: 36, y: 70, w: 380, h: 116 } // the chart's box in the stage
const scrubPts = chartPoints({ data: SCRUB, kind: 'line', width: SC.w, height: SC.h, max: 56 })
type SS = { i: number }
async function scrubScript(a: Act<SS>) {
  await a.wait(700)
  for (const i of [4, 6, 8]) {
    const p = scrubPts[i]
    await a.move({ x: SC.x + p.x, y: SC.y + p.y + 26 }, { duration: 650 })
    await a.set({ i })
    await a.wait(900)
  }
  await a.move({ x: 300, y: 186 })
  await a.set({ i: -1 })
  await a.wait(900)
}
function ScrubScene({ label }: { label: string }) {
  return (
    <Close<SS> initial={{ i: -1 }} poster={{ i: 8 }} script={scrubScript} cursor={{ x: 300, y: 186 }}>
      {(s) => {
        const p = s.i >= 0 ? scrubPts[s.i] : null
        return (
          <div className="cx-card" style={{ left: 20, top: 16, width: 400, height: 220 }}>
            <div className="cx-head">
              <span className="cx-h">{label}</span>
              <span className="cx-read num" data-on={!!p}>
                <TextMorph>{p ? SCRUB_DAYS[s.i] : SCRUB_DAYS[11]}</TextMorph>
                <b><TextMorph numbers>{(Math.round(SCRUB[p ? s.i : 11] * 47.3)).toLocaleString('en-US')}</TextMorph></b>
              </span>
            </div>
            <div style={{ position: 'absolute', left: SC.x - 20, top: SC.y - 16 }}>
              <Chart kind="line" data={SCRUB} width={SC.w} height={SC.h} max={56} area show className="cx-line" />
              <i className="cx-hair" style={{ left: p?.x ?? 0, opacity: p ? 1 : 0 }} />
              <i className="cx-dot" style={{ left: p?.x ?? 0, top: p?.y ?? 0, opacity: p ? 1 : 0 }} />
            </div>
          </div>
        )
      }}
    </Close>
  )
}

/* ── Event activity: tap a legend chip, that event type leaves the stack ── */
const STACK = [[34, 22, 8], [38, 26, 9], [44, 24, 10], [30, 18, 7], [33, 20, 8], [48, 30, 11], [56, 34, 12]]
type BS = { hide: boolean }
async function barsScript(a: Act<BS>) {
  await a.wait(900)
  await a.click({ at: 'chip' }); await a.set({ hide: true })
  await a.wait(2300)
  await a.click({ at: 'chip' }); await a.set({ hide: false })
  await a.wait(1200)
  await a.move({ x: 290, y: 170 }) // back to the start, so the loop has no jump
  await a.wait(400)
}
function BarsScene() {
  return (
    <Close<BS> initial={{ hide: false }} poster={{ hide: true }} script={barsScript} cursor={{ x: 290, y: 170 }}>
      {(s) => (
        <div className="cx-card" style={{ left: 20, top: 16, width: 400, height: 220 }}>
          <div className="cx-h">Event Activity</div>
          <div className="cx-chips">
            <span className="cx-chip"><i style={{ background: '#d97706' }} />Page views</span>
            <span className="cx-chip" data-off={s.hide} data-target="chip" data-cursor="pointer"><i style={{ background: '#2a78d6' }} />Clicks</span>
            <span className="cx-chip"><i style={{ background: '#1baf7a' }} />Custom events</span>
          </div>
          <div className="cx-stack">
            {STACK.map(([pv, cl, cu], i) => (
              <div key={i} className="cx-col">
                <i style={{ height: cu * 1.5, background: '#1baf7a' }} />
                <i style={{ height: s.hide ? 0 : cl * 1.5, background: '#2a78d6', marginTop: s.hide ? 0 : 2 }} />
                <i style={{ height: pv * 1.5, background: '#d97706' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Close>
  )
}

/* ── Data switch: Empty clears the chart; Filled brings the data back behind a glimm sweep ── */
const FILL = [10, 16, 16, 24, 27, 31, 44, 50, 62, 70, 84, 100]
const SWEEP = accentPair('#d97706', '#feceab')
type FS = { m: 'filled' | 'empty' }
async function fillScript(a: Act<FS>) {
  await a.wait(900)
  await a.click({ at: 'empty' }); await a.set({ m: 'empty' })
  await a.wait(1700)
  await a.click({ at: 'filled' }); await a.set({ m: 'filled' })
  await a.wait(2000)
  await a.move({ x: 200, y: 120 }) // back to the start, so the loop has no jump
  await a.wait(600)
}
function FillChart({ m }: { m: FS['m'] }) {
  const scope = useRef<GlimmScopeHandle>(null)
  const prev = useRef(m)
  const filled = m === 'filled'
  useEffect(() => {
    // only on empty → filled; StrictMode's second mount sees no change, so no stray sweep
    if (prev.current === 'empty' && filled) scope.current?.play({}) // the band passes over the data as it lands
    prev.current = m
  }, [m, filled])
  return (
    <GlimmScope ref={scope} palette={SWEEP} direction="ltr" sweepMs={1300} curve={0.06} bandTight={34} pageEffect={false} style={{ position: 'absolute', inset: 0 }}>
      <div className="fx-fill" data-filled={filled}>
        <div className="fx-fill-grid">{[0, 1, 2, 3].map((i) => <i key={i} />)}</div>
        <div className="fx-fill-bars">
          {FILL.map((h, i) => (
            <span key={i} style={{ height: `${h}%`, transitionDelay: filled ? `${i * 25}ms` : '0ms' }}><b style={{ height: `${Math.max(20, h - 8)}%` }} /></span>
          ))}
        </div>
        <div className="fx-fill-empty"><b>No visits in this period</b><span>Try a longer period.</span></div>
      </div>
    </GlimmScope>
  )
}
function FillScene() {
  return (
    <Close<FS> initial={{ m: 'filled' }} poster={{ m: 'filled' }} script={fillScript} cursor={{ x: 200, y: 120 }}>
      {(s) => (
        <>
          <div className="cx-card" style={{ left: -14, top: -14, width: 350, height: 156, padding: '28px 16px 12px 30px' }}>
            <div style={{ position: 'relative', height: 112 }}><FillChart m={s.m} /></div>
          </div>
          <div className="cx-dock" style={{ right: 16, top: 152 }}>
            <span className="cx-dock-l">Data</span>
            <span className="cx-seg">
              <i className="cx-thumb" style={{ left: s.m === 'filled' ? 3 : 141, width: s.m === 'filled' ? 64 : 62 }} />
              <span data-on={s.m === 'filled'} data-target="filled" data-cursor="pointer">Filled</span>
              <span>Loading</span>
              <span data-on={s.m === 'empty'} data-target="empty" data-cursor="pointer">Empty</span>
            </span>
          </div>
        </>
      )}
    </Close>
  )
}

/* ── Funnel: each step lands in order, with the drop between them ── */
const FUN = [{ l: '/', v: 100 }, { l: '/pricing', v: 64 }, { l: '/signup', v: 38 }, { l: '/checkout', v: 21 }]
type FuS = { n: number }
async function funnelScript(a: Act<FuS>) {
  for (let n = 1; n <= 4; n++) { await a.wait(n === 1 ? 500 : 420); await a.set({ n }) }
  await a.wait(2800)
  await a.set({ n: 0 })
  await a.wait(500)
}
function FunnelScene() {
  const colW = 64, gap = 36, base = 156, span = 80 // tallest column tops out at 68, clear of the title
  return (
    <Close<FuS> initial={{ n: 0 }} poster={{ n: 4 }} script={funnelScript}>
      {(s) => (
        <div className="cx-card" style={{ left: 20, top: 16, width: 400, height: 220 }}>
          <div className="cx-head"><span className="cx-h">Conversion Funnel</span></div>
          <svg className="cx-funnel" width={400} height={200} style={{ position: 'absolute', left: 0, top: 0 }}>
            {FUN.map((f, i) => {
              const x = 20 + i * (colW + gap), h = (span * f.v) / 100 + 8
              const next = FUN[i + 1], on = s.n > i, flowOn = s.n > i + 1
              const nh = next ? (span * next.v) / 100 + 8 : 0
              return (
                <g key={f.l}>
                  {next && <path d={`M${x + colW},${base - h} L${x + colW + gap},${base - nh} L${x + colW + gap},${base} L${x + colW},${base} Z`}
                    fill="#d97706" opacity={flowOn ? 0.18 : 0} style={{ transition: 'opacity .4s ease' }} />}
                  <rect x={x} y={base - h} width={colW} height={h} rx={4} fill="#d97706" opacity={1 - i * 0.14}
                    style={{ transformOrigin: `${x}px ${base}px`, transform: on ? 'none' : 'scaleY(0)', transition: 'transform .5s cubic-bezier(.23,1,.32,1)' }} />
                  <text x={x} y={base + 18} className="cx-fl">{f.l}</text>
                  <text x={x + colW / 2} y={base - h - 8} textAnchor="middle" className="cx-fv" opacity={on ? 1 : 0} style={{ transition: 'opacity .3s ease' }}>{f.v}%</text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </Close>
  )
}

/* ── Agent: type a question, send it, the queries run and the answer comes back as a chart ── */
type AS = { q: string; sent: boolean; phase: 0 | 1 | 2 }
async function agentScript(a: Act<AS>) {
  await a.wait(500)
  await a.type('q', 'Why did sign-ups dip?', { interval: 45 })
  await a.wait(200)
  await a.click({ at: 'send' }); await a.set({ sent: true, q: '', phase: 1 })
  await a.move({ x: 300, y: 112 })
  await a.wait(1200)
  await a.set({ phase: 2 })
  await a.wait(2600)
  await a.set({ sent: false, phase: 0 })
  await a.move({ x: 318, y: 184 })
  await a.wait(400)
}
function AgentScene() {
  return (
    <Close<AS> initial={{ q: '', sent: false, phase: 0 }} poster={{ q: '', sent: true, phase: 2 }} script={agentScript} cursor={{ x: 318, y: 184 }}>
      {(s) => (
        <>
          <div className="cx-q" data-on={s.sent} style={{ right: 20, top: 14 }}>Why did sign-ups dip?</div>
          <div className="cx-run" data-on={s.phase > 0} style={{ left: 20, top: 48 }}>
            <img src="/brand/ferno-agent.svg" width={16} height={16} alt="" className={s.phase === 1 ? 'mark-think' : undefined} />
            <TextMorph>{s.phase === 2 ? 'Ran 3 queries' : 'Running queries…'}</TextMorph>
          </div>
          <div className="cx-ans" data-on={s.phase === 2} style={{ left: 20, top: 74 }}>
            <Bar w={210} h={7} tone={2} />
            <Chart kind="line" data={[30, 32, 31, 34, 33, 22, 24, 26]} width={210} height={34} area show={s.phase === 2} className="cx-line" />
          </div>
          <div className="cx-composer" style={{ left: 20, top: 122, width: 340 }}>
            <div className={'cx-input' + (s.q ? '' : ' ph')}>{s.q || 'Ask about sign-ups, a page…'}</div>
            <div className="cx-crow">
              <span className="cx-cchip">Last 7 days</span>
              <span className="cx-send" data-ready={!!s.q} data-target="send" data-cursor="pointer"><Send size={14} /></span>
            </div>
          </div>
        </>
      )}
    </Close>
  )
}

/* ── Heatmap: repeated clicks on one spot heat it up and flag a rage click ── */
type HS = { n: number }
async function heatScript(a: Act<HS>) {
  await a.wait(600)
  await a.move({ at: 'cta' })
  for (let n = 1; n <= 4; n++) { await a.click({ at: 'cta' }); await a.set({ n }); await a.wait(70) }
  await a.move({ x: 300, y: 70 })
  await a.wait(2400)
  await a.set({ n: 0 })
  await a.wait(600)
}
function HeatScene() {
  return (
    <Close<HS> initial={{ n: 0 }} poster={{ n: 4 }} script={heatScript} cursor={{ x: 300, y: 70 }}>
      {(s) => (
        <div className="cx-card cx-page" style={{ left: 20, top: 16, width: 400, height: 220 }}>
          <div className="cx-pnav"><Bar w={44} h={8} tone={3} /><Bar w={28} h={6} tone={1} /><Bar w={28} h={6} tone={1} /></div>
          <Bar w={190} h={12} tone={3} />
          <Bar w={140} h={8} tone={1} />
          <span className="cx-cta" data-target="cta" data-cursor="pointer">Export</span>
          <div className="cx-pcards"><i /><i /><i /></div>
          <span className="cx-blob" style={{ left: 250, top: 22, ['--s' as string]: '54px', opacity: .55 }} />
          <span className="cx-blob" style={{ left: 80, top: 172, ['--s' as string]: '70px', opacity: .45 }} />
          <span className="cx-blob" style={{ left: 50, top: 112, ['--s' as string]: `${40 + s.n * 16}px`, opacity: s.n ? 0.5 + s.n * 0.12 : 0 }} />
          <span className="cx-rage" data-on={s.n >= 3} style={{ left: 50, top: 112 }} />
        </div>
      )}
    </Close>
  )
}

/* ── Report: the investigation finishes; status, impact and meter land with it ── */
const RAMP = ['var(--accent-100)', 'var(--accent-200)', 'var(--accent-300)', 'var(--accent-400)', 'var(--accent-500)']
type RpS = { done: boolean }
async function reportScript(a: Act<RpS>) {
  await a.wait(1500); await a.set({ done: true })
  await a.wait(3200); await a.set({ done: false })
  await a.wait(300)
}
function ReportScene() {
  return (
    <Close<RpS> initial={{ done: false }} poster={{ done: true }} script={reportScript}>
      {(s) => (
        <>
          <div className="cx-card cx-rrow" style={{ left: 16, top: 16, width: 328, height: 150 }}>
            <div className="cx-rmeta"><span className="mono">dead_click · /pricing</span><span>Nov 24</span></div>
            <div className="cx-rt">Dead clicks on the pricing toggle</div>
            <div className="cx-rfoot">
              <span className="cx-change">Change <b className="up num">↑ 1,033%</b></span>
              {/* the Reports page's own status chip */}
              <span className={'rp-status ' + (s.done ? 'done' : 'running')}>
                {s.done ? <Check size={12} strokeWidth={2.5} /> : <Loader2 size={12} className="spin" />}<TextMorph>{s.done ? 'Completed' : 'Investigating'}</TextMorph>
              </span>
              <span className="cx-meter" data-on={s.done}>
                {RAMP.map((_, i) => <i key={i} style={{ background: s.done && i < 4 ? RAMP[1 + i] : undefined, transitionDelay: s.done ? `${i * 80}ms` : '0ms' }} />)}
              </span>
            </div>
          </div>
          <div className="cx-card" style={{ left: 16, top: 174, width: 328, height: 60 }}><Bar w={150} h={8} tone={2} /></div>
        </>
      )}
    </Close>
  )
}

/* ── Ranked list: switch the tab, labels morph and bars slide ── */
const LISTS: Record<ListSet, { tabs: [string, string]; mono: boolean; rows: { l: string; v: number }[][] }> = {
  pages: { tabs: ['Top', 'Entry'], mono: true, rows: [
    [{ l: '/', v: 43 }, { l: '/pricing', v: 20 }, { l: '/docs', v: 14 }, { l: '/blog', v: 10 }],
    [{ l: '/pricing', v: 38 }, { l: '/', v: 31 }, { l: '/signup', v: 12 }, { l: '/docs', v: 8 }],
  ] },
  sources: { tabs: ['Sources', 'Campaigns'], mono: false, rows: [
    [{ l: 'Direct', v: 43 }, { l: 'Google', v: 27 }, { l: 'X (Twitter)', v: 12 }, { l: 'Slack', v: 9 }],
    [{ l: 'launch_week', v: 46 }, { l: 'newsletter', v: 24 }, { l: 'x_ads', v: 11 }, { l: 'partners', v: 6 }],
  ] },
  tech: { tabs: ['Devices', 'Browsers'], mono: false, rows: [
    [{ l: 'Desktop', v: 64 }, { l: 'Mobile', v: 31 }, { l: 'Tablet', v: 5 }, { l: 'Other', v: 1 }],
    [{ l: 'Chrome', v: 58 }, { l: 'Safari', v: 27 }, { l: 'Firefox', v: 9 }, { l: 'Edge', v: 5 }],
  ] },
  region: { tabs: ['Timezones', 'Languages'], mono: false, rows: [
    [{ l: 'Africa/Lagos', v: 31 }, { l: 'Europe/London', v: 23 }, { l: 'America/New_York', v: 20 }, { l: 'Asia/Kolkata', v: 9 }],
    [{ l: 'English', v: 71 }, { l: 'French', v: 11 }, { l: 'German', v: 7 }, { l: 'Yoruba', v: 4 }],
  ] },
}
type LS = { t: 0 | 1 }
async function listScript(a: Act<LS>) {
  await a.wait(900)
  await a.click({ at: 'tab1' }); await a.set({ t: 1 })
  await a.wait(2400)
  await a.click({ at: 'tab0' }); await a.set({ t: 0 })
  await a.wait(1400)
  await a.move({ x: 220, y: 170 }) // back to the start, so the loop has no jump
  await a.wait(400)
}
function ListScene({ set, label }: { set: ListSet; label: string }) {
  const L = LISTS[set]
  return (
    <Close<LS> initial={{ t: 0 }} poster={{ t: 1 }} script={listScript} cursor={{ x: 220, y: 170 }}>
      {(s) => {
        const rows = L.rows[s.t], max = Math.max(...rows.map((r) => r.v))
        return (
          <div className="cx-card" style={{ left: 16, top: 16, width: 328, height: 220 }}>
            <div className="cx-head">
              <span className="cx-h">{label}</span>
              <span className="cx-tabs">
                {L.tabs.map((t, i) => <span key={t} data-on={s.t === i} data-target={'tab' + i} data-cursor="pointer">{t}</span>)}
              </span>
            </div>
            <div className="cx-list">
              {rows.map((r, i) => (
                <div key={i} className="cx-lrow">
                  <i style={{ width: `${(r.v / max) * 100}%` }} />
                  <span className={L.mono ? 'mono' : undefined}><TextMorph>{r.l}</TextMorph></span>
                  <span className="num"><TextMorph numbers>{`${r.v}%`}</TextMorph></span>
                </div>
              ))}
            </div>
          </div>
        )
      }}
    </Close>
  )
}

/* ── New vs returning: point at a group, its share comes forward ── */
type DS = { f: 'n' | 'r' | null }
async function donutScript(a: Act<DS>) {
  await a.wait(800)
  await a.move({ at: 'lr' }); await a.set({ f: 'r' })
  await a.wait(1800)
  await a.move({ at: 'ln' }); await a.set({ f: 'n' })
  await a.wait(1800)
  await a.move({ x: 320, y: 186 }); await a.set({ f: null })
  await a.wait(1000)
}
function DonutScene() {
  const R = 48, C = 2 * Math.PI * R, p = 62
  return (
    <Close<DS> initial={{ f: null }} poster={{ f: 'r' }} script={donutScript} cursor={{ x: 320, y: 186 }}>
      {(s) => (
        <div className="cx-card" style={{ left: 16, top: 16, width: 328, height: 220 }}>
          <div className="cx-h">New vs. Returning</div>
          <div className="cx-donut">
            <svg width="124" height="124" viewBox="0 0 124 124">
              <circle cx="62" cy="62" r={R} fill="none" stroke="#2a78d6" strokeWidth="16" opacity={s.f === 'n' ? 0.25 : 1} style={{ transition: 'opacity .25s ease' }} />
              <circle cx="62" cy="62" r={R} fill="none" stroke="#d97706" strokeWidth="16" strokeDasharray={`${(p / 100) * C - 3} ${C}`} transform="rotate(-90 62 62)"
                opacity={s.f === 'r' ? 0.25 : 1} style={{ transition: 'opacity .25s ease' }} />
              <text x="62" y="60" textAnchor="middle" className="cx-dn num">{s.f === 'r' ? '1,285' : s.f === 'n' ? '2,096' : '3,381'}</text>
              <text x="62" y="78" textAnchor="middle" className="cx-ds">{s.f === 'r' ? 'returning' : s.f === 'n' ? 'new' : 'visitors'}</text>
            </svg>
            <div className="cx-legend">
              <div data-target="ln" data-dim={s.f === 'r'}><i style={{ background: '#d97706' }} />New<b className="num">62%</b></div>
              <div data-target="lr" data-dim={s.f === 'n'}><i style={{ background: '#2a78d6' }} />Returning<b className="num">38%</b></div>
            </div>
          </div>
        </div>
      )}
    </Close>
  )
}

/* ── Retention: hover a cell for that cohort's share in that week ── */
const COHORTS = [['Nov 3', [100, 46, 38, 31]], ['Nov 10', [100, 52, 41, 0]], ['Nov 17', [100, 49, 0, 0]], ['Nov 24', [100, 0, 0, 0]]] as const
type ReS = { hover: boolean }
async function retentionScript(a: Act<ReS>) {
  await a.wait(800)
  await a.move({ at: 'cell' }); await a.set({ hover: true })
  await a.wait(2600)
  await a.move({ x: 320, y: 190 }); await a.set({ hover: false })
  await a.wait(1000)
}
function RetentionScene() {
  return (
    <Close<ReS> initial={{ hover: false }} poster={{ hover: true }} script={retentionScript} cursor={{ x: 320, y: 190 }}>
      {(s) => (
        <div className="cx-card" style={{ left: 16, top: 16, width: 400, height: 220 }}>
          <div className="cx-h">Weekly Retention</div>
          <div className="cx-ret">
            <span /><span>Week 0</span><span>Week 1</span><span>Week 2</span><span>Week 3</span>
            {COHORTS.map(([c, vals]) => (
              <div key={c} className="cx-retrow">
                <span className="cx-rc">{c}</span>
                {vals.map((v, w) => (
                  <i key={w} data-target={c === 'Nov 10' && w === 2 ? 'cell' : undefined}
                    data-hot={s.hover && c === 'Nov 10' && w === 2}
                    style={{ background: v ? `rgba(217,119,6,${w === 0 ? 0.9 : v / 80})` : 'var(--n-50)', color: w === 0 || v > 45 ? '#fff' : 'var(--n-900)' }}>
                    {v ? `${v}%` : ''}
                  </i>
                ))}
              </div>
            ))}
          </div>
          <div className="cx-tt" data-on={s.hover} style={{ left: 214, top: 140 }}>Nov 10 · week 2 <b className="num">41%</b></div>
        </div>
      )}
    </Close>
  )
}
