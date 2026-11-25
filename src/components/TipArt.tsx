import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { TextMorph } from 'torph/react'
import { GlimmScope, type GlimmScopeHandle } from 'glimm/react'
import { accentPair } from 'glimm'
import { Bar, Chart, Stage, type Act } from '../kit'
import { LiveChart } from '../charts/LiveChart'

/**
 * Faux-UI illustrations for the tip card (Figma: Ferno · Tooltip, 230:35347).
 *
 * The amber panel from the Figma frame: a 5 × 5 grid of white squares on the
 * right, a back card tilted −2.74°, and a front card that runs off the bottom
 * edge. The front card holds a tiny, living version of the thing the tip
 * points at. Each piece uses the package that fits it:
 *   - torph: numbers and labels that change (KPI, ranked lists, donut)
 *   - Liveline: line charts that morph between periods
 *   - stageshow: the scripted agent exchange and the kit bar chart
 *   - glimm: the one empty → filled transition, as an accent sweep
 * Everything holds still under reduced motion.
 */
export type ArtKind = 'kpi' | 'line' | 'bars' | 'fill' | 'funnel' | 'agent' | 'heat' | 'report' | 'list' | 'retention' | 'donut'
export type ListSet = 'pages' | 'sources' | 'tech' | 'region'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Steps through `n` states every `ms` while mounted (stays on 0 under reduced motion). */
function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced()) return
    const t = setInterval(() => setI((x) => (x + 1) % n), ms)
    return () => clearInterval(t)
  }, [n, ms])
  return i
}

// Figma 230:35352: white square alphas, row by row
const GRID = [0, .2, .4, .2, .8, .2, .4, .7, .8, 0, .8, 0, 0, .8, .2, 0, .8, .4, 0, .7, .8, .7, .2, .4, .4]

export function TipArt({ kind, eyebrow, label, set, w }: { kind: ArtKind; eyebrow: string; label: string; set?: ListSet; w: number }) {
  return (
    <div className="tip-art" aria-hidden>
      <div className="tip-grid">{GRID.map((a, i) => <i key={i} style={{ background: `rgba(255,255,255,${a})` }} />)}</div>
      <div className="tip-back" />
      <div className="tip-front">
        <div className="tip-fhead">
          <span className="tip-eyebrow">{eyebrow}</span>
          <span className="tip-flabel">{label}</span>
        </div>
        <Faux kind={kind} set={set} w={w} />
      </div>
    </div>
  )
}

function Faux({ kind, set, w }: { kind: ArtKind; set?: ListSet; w: number }) {
  switch (kind) {
    case 'kpi': return <FauxKpi />
    case 'line': return <FauxLine w={w} />
    case 'bars': return <FauxBars w={w} />
    case 'fill': return <FauxFill w={w} />
    case 'funnel': return <FauxFunnel />
    case 'agent': return <FauxAgent w={w} />
    case 'heat': return <FauxHeat />
    case 'report': return <FauxReport />
    case 'list': return <FauxList set={set ?? 'pages'} />
    case 'retention': return <FauxRetention />
    case 'donut': return <FauxDonut />
  }
}

/* KPI: the number, delta and period morph together, the way they do on a range switch */
const KPI = [
  { v: '12,480', d: '8.1%', up: true, p: 'Last 7 days' },
  { v: '48,906', d: '11.4%', up: true, p: 'Last 30 days' },
  { v: '131,212', d: '2.3%', up: false, p: 'Last 90 days' },
]
function FauxKpi() {
  const k = KPI[useCycle(KPI.length, 2200)]
  return (
    <div className="fx-kpi">
      <div className="fx-kpi-l"><Users size={12} />Active users</div>
      <div className="fx-kpi-v num">
        <TextMorph numbers>{k.v}</TextMorph>
        <span className={'pill ' + (k.up ? 'up' : 'down')}>{k.up ? '↑' : '↓'}<TextMorph numbers>{k.d}</TextMorph></span>
      </div>
      <div className="fx-kpi-f mono"><TextMorph>{k.p}</TextMorph></div>
      <div className="fx-kpi-bars">{[30, 42, 38, 55, 48, 66, 72].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
    </div>
  )
}

/* Line: a Liveline that morphs between two periods */
const LINES = [
  [22, 26, 24, 30, 34, 31, 38, 42, 40, 47, 52, 50, 58, 63],
  [30, 28, 33, 31, 36, 44, 41, 39, 46, 44, 51, 57, 55, 60],
]
const LINE_LABELS = Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`)
function FauxLine({ w }: { w: number }) {
  const v = LINES[useCycle(LINES.length, 2600)]
  return (
    <div style={{ width: w, marginLeft: -4 }}>
      <LiveChart mini height={118} labels={LINE_LABELS} series={[{ key: 'a', label: 'Active', color: '#d97706', values: v }]} />
    </div>
  )
}

/* Bars: the stageshow kit chart easing between days */
const BARS = [[14, 22, 19, 30, 26, 38, 44, 40], [18, 16, 26, 24, 34, 30, 41, 52]]
function FauxBars({ w }: { w: number }) {
  const d = BARS[useCycle(BARS.length, 2400)]
  return <Chart kind="bars" data={d} width={w} height={118} max={56} show className="fx-chart" />
}

/* Fill: glimm sweeps an accent band across an empty card and the data lands behind it */
const FILL = [8, 16, 16, 24, 27, 31, 44, 50, 62, 70, 84, 100]
const SWEEP = accentPair('#d97706', '#feceab')
function FauxFill({ w }: { w: number }) {
  const scope = useRef<GlimmScopeHandle>(null)
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    if (reduced()) { setFilled(true); return }
    const timers: number[] = []
    const run = () => {
      timers.push(window.setTimeout(() => scope.current?.play({ change: () => setFilled(true) }), 900))
      // the card empties out again (a new, empty period) before the next sweep
      timers.push(window.setTimeout(() => setFilled(false), 4600))
    }
    run()
    const loop = window.setInterval(run, 5400)
    return () => { clearInterval(loop); timers.forEach(clearTimeout) }
  }, [])
  return (
    <div style={{ width: w, height: 124, position: 'relative' }}>
      <GlimmScope ref={scope} palette={SWEEP} direction="ltr" sweepMs={1300} curve={0.06} bandTight={34} pageEffect={false}
        style={{ position: 'absolute', inset: 0 }}>
        <div className="fx-fill" data-filled={filled}>
          <div className="fx-fill-grid">{[0, 1, 2, 3].map((i) => <i key={i} />)}</div>
          <div className="fx-fill-bars">
            {FILL.map((h, i) => (
              <span key={i} style={{ height: `${Math.max(10, h)}%`, transitionDelay: filled ? `${i * 25}ms` : '0ms' }}>
                <b style={{ height: `${Math.max(20, h - 8)}%` }} />
              </span>
            ))}
          </div>
          <div className="fx-fill-empty">
            <b>No visits in this period</b>
            <span>Try a longer period.</span>
          </div>
        </div>
      </GlimmScope>
    </div>
  )
}

/* Funnel: four steps narrowing in order */
const FUNNEL = [['Landing', 100], ['Pricing', 64], ['Sign up', 38], ['Checkout', 21]] as const
function FauxFunnel() {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(t) }, [])
  return (
    <div className="fx-funnel">
      {FUNNEL.map(([l, v], i) => (
        <div key={l} className="fx-frow">
          <span className="fx-fl">{l}</span>
          <span className="fx-ftrack"><i style={{ width: on ? `${v}%` : '0%', transitionDelay: `${i * 90}ms`, opacity: 1 - i * 0.16 }} /></span>
          <span className="fx-fv num">{v}%</span>
        </div>
      ))}
    </div>
  )
}

/* Agent: question → queries → answer chart, scripted with stageshow */
type AS = { step: 0 | 1 | 2 | 3 }
async function agentScript(a: Act<AS>) {
  await a.wait(500)
  a.set({ step: 1 })
  await a.wait(900)
  a.set({ step: 2 })
  await a.wait(1100)
  a.set({ step: 3 })
  await a.wait(2800)
  a.set({ step: 0 })
  await a.wait(400)
}
function FauxAgent({ w }: { w: number }) {
  return (
    <Stage width={w} height={128} initial={{ step: 0 } as AS} poster={{ step: 3 }} script={agentScript} play="loop" className="fx-stage" accent="#d97706" unframed>
      {(s) => (
        <div className="fx-agent" data-step={s.step} style={{ width: w }}>
          <div className="fx-q">Why did sign-ups dip?</div>
          <div className="fx-run"><img src="/brand/ferno-agent.svg" width={12} height={12} alt="" className={s.step === 2 ? 'mark-think' : undefined} />{s.step >= 3 ? 'Ran 3 queries' : 'Running queries…'}</div>
          <div className="fx-ans">
            <Bar w={Math.round(w * 0.78)} h={6} tone={2} />
            <Bar w={Math.round(w * 0.56)} h={6} tone={1} />
            <Chart kind="line" data={[30, 32, 31, 34, 33, 22, 24, 26]} width={w} height={44} show={s.step >= 3} area className="fx-chart" />
          </div>
        </div>
      )}
    </Stage>
  )
}

/* Heatmap: a page wireframe with heat over the hot spots and one rage-click ring */
function FauxHeat() {
  return (
    <div className="fx-heat">
      <div className="fx-hnav"><Bar w={34} h={6} tone={3} /><Bar w={22} h={5} tone={1} /><Bar w={22} h={5} tone={1} /><span className="fx-hbtn" /></div>
      <Bar w={130} h={9} tone={3} />
      <Bar w={96} h={6} tone={1} />
      <div className="fx-hcards"><i /><i /><i /></div>
      <span className="fx-blob" style={{ left: '78%', top: '10%', ['--s' as string]: '46px' }} />
      <span className="fx-blob" style={{ left: '30%', top: '72%', ['--s' as string]: '60px', animationDelay: '.6s' }} />
      <span className="fx-blob" style={{ left: '62%', top: '70%', ['--s' as string]: '34px', animationDelay: '1.1s' }} />
      <span className="fx-rage" style={{ left: '30%', top: '72%' }} />
    </div>
  )
}

/* Report: a finished investigation with its impact meter filling in */
const RAMP = ['var(--accent-100)', 'var(--accent-200)', 'var(--accent-300)', 'var(--accent-400)', 'var(--accent-500)']
function FauxReport() {
  return (
    <div className="fx-report">
      {[{ t: 'Sign-ups dipped after v2.4', n: 4 }, { t: null, n: 2 }].map((r, k) => (
        <div key={k} className="fx-rrow">
          <div className="fx-rmain">
            {r.t ? <span className="fx-rt">{r.t}</span> : <Bar w={108} h={7} tone={2} />}
            {r.t ? <span className="fx-chip">Completed</span> : <Bar w={52} h={6} tone={1} />}
          </div>
          <span className="fx-meter">
            {RAMP.map((_, i) => <i key={i} data-on={i < r.n} style={{ background: i < r.n ? RAMP[5 - r.n + i] : undefined, animationDelay: `${300 + k * 200 + i * 90}ms` }} />)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* Ranked list: labels morph and bars slide, as on a tab switch */
const LISTS: Record<ListSet, { l: string; v: number }[][]> = {
  pages: [
    [{ l: '/pricing', v: 38 }, { l: '/docs', v: 27 }, { l: '/blog/launch', v: 19 }],
    [{ l: '/', v: 44 }, { l: '/pricing', v: 22 }, { l: '/signup', v: 14 }],
  ],
  sources: [
    [{ l: 'google.com', v: 41 }, { l: 'Direct', v: 29 }, { l: 'github.com', v: 12 }],
    [{ l: 'launch-week', v: 36 }, { l: 'newsletter', v: 24 }, { l: 'x-ads', v: 9 }],
  ],
  tech: [
    [{ l: 'Desktop', v: 62 }, { l: 'Mobile', v: 34 }, { l: 'Tablet', v: 4 }],
    [{ l: 'Chrome', v: 58 }, { l: 'Safari', v: 27 }, { l: 'Firefox', v: 9 }],
  ],
  region: [
    [{ l: 'Europe/London', v: 31 }, { l: 'America/New_York', v: 24 }, { l: 'Africa/Lagos', v: 13 }],
    [{ l: 'English', v: 71 }, { l: 'French', v: 11 }, { l: 'German', v: 7 }],
  ],
}
function FauxList({ set }: { set: ListSet }) {
  const rows = LISTS[set][useCycle(2, 2400)]
  const max = Math.max(...rows.map((r) => r.v))
  return (
    <div className="fx-list">
      {rows.map((r, i) => (
        <div key={i} className="fx-lrow">
          <i style={{ width: `${(r.v / max) * 100}%` }} />
          <span className={set === 'pages' || set === 'sources' ? 'mono' : undefined}><TextMorph>{r.l}</TextMorph></span>
          <span className="num"><TextMorph numbers>{`${r.v}%`}</TextMorph></span>
        </div>
      ))}
    </div>
  )
}

/* Retention: each weekly cohort fading as weeks pass */
function FauxRetention() {
  const rows = 5
  return (
    <div className="fx-ret">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="fx-retrow">
          {Array.from({ length: rows }, (_, c) => {
            const live = c < rows - r
            const v = c === 0 ? 1 : Math.max(0.12, 0.62 - c * 0.13 - r * 0.03)
            return <i key={c} style={live ? { background: `rgba(217,119,6,${v})`, animationDelay: `${(r + c) * 70}ms` } : { background: 'transparent' }} />
          })}
        </div>
      ))}
    </div>
  )
}

/* Donut: new vs returning, the split and its share morphing */
const SPLITS = [64, 58]
function FauxDonut() {
  const p = SPLITS[useCycle(SPLITS.length, 2600)]
  const R = 34, C = 2 * Math.PI * R
  return (
    <div className="fx-donut">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={R} fill="none" stroke="#2a78d6" strokeWidth="12" />
        <circle cx="46" cy="46" r={R} fill="none" stroke="#d97706" strokeWidth="12" strokeDasharray={`${(p / 100) * C - 3} ${C}`}
          transform="rotate(-90 46 46)" style={{ transition: 'stroke-dasharray .7s cubic-bezier(.23,1,.32,1)' }} />
      </svg>
      <div className="fx-dl">
        <Legend c="#d97706" l="New"><TextMorph numbers>{`${p}%`}</TextMorph></Legend>
        <Legend c="#2a78d6" l="Returning"><TextMorph numbers>{`${100 - p}%`}</TextMorph></Legend>
      </div>
    </div>
  )
}
function Legend({ c, l, children }: { c: string; l: string; children: ReactNode }) {
  return <div className="fx-leg"><i style={{ background: c }} />{l}<span className="num">{children}</span></div>
}
