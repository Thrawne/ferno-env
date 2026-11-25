import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Info } from 'lucide-react'
import { TipArt, type ArtKind, type ListSet } from './TipArt'
import { useApp } from './ui'
import './tips.css'

/* ───────── Content ───────── */
export type TipDef = { title: string; sub: string; art: ArtKind; eyebrow: string; label: string; set?: ListSet }

/** Info tips beside card titles. Short: what the card measures, nothing more. */
export const TIPS = {
  activeUsers: { title: 'Active users', sub: 'People who did anything in the period. Returning is the share who had visited before.', art: 'line', eyebrow: 'Chart', label: 'Active users' },
  eventActivity: { title: 'Event activity', sub: 'Every tracked event per day, stacked by type. Tap a legend chip to hide a type.', art: 'bars', eyebrow: 'Chart', label: 'Events per day' },
  funnel: { title: 'Conversion funnel', sub: 'How many people reach each step, in order. Edit it to track your own steps.', art: 'funnel', eyebrow: 'Funnel', label: 'Landing → Checkout' },
  traffic: { title: 'Traffic', sub: 'Visitors, views or sessions, against the previous period.', art: 'line', eyebrow: 'Chart', label: 'Visitors' },
  pages: { title: 'Pages', sub: 'The most visited pages, and where visits start and end.', art: 'list', set: 'pages', eyebrow: 'List', label: 'Top pages' },
  sources: { title: 'Sources', sub: 'Where visits come from: referring sites, or your tagged campaigns.', art: 'list', set: 'sources', eyebrow: 'List', label: 'Top sources' },
  newReturning: { title: 'New vs. returning', sub: 'First-time visitors against people who have been here before.', art: 'donut', eyebrow: 'Split', label: 'Visitors' },
  technology: { title: 'Technology', sub: 'The devices, browsers and systems your visitors use.', art: 'list', set: 'tech', eyebrow: 'List', label: 'Devices' },
  region: { title: 'Region', sub: 'Where your visitors are, by timezone and language.', art: 'list', set: 'region', eyebrow: 'List', label: 'Timezones' },
  retention: { title: 'Weekly retention', sub: "Each row is one week's new users. Each cell is the share still active weeks later.", art: 'retention', eyebrow: 'Cohorts', label: 'Weekly retention' },
  heatmap: { title: 'Heatmaps', sub: 'Clicks, rage clicks and pointer movement on one page.', art: 'heat', eyebrow: 'Heatmap', label: '/pricing' },
} satisfies Record<string, TipDef>
export type TipId = keyof typeof TIPS

type Step = TipDef & { route: string | null; target: string }
/** The guided tour. `route: null` stays on whatever page is open. */
const STEPS: Step[] = [
  { route: 'overview', target: 'kpis', title: 'Your numbers at a glance', sub: 'Each tile compares this period with the one before it.', art: 'kpi', eyebrow: 'KPI', label: 'This period' },
  { route: 'overview', target: 'range', title: 'Change the period', sub: 'Every chart and number follows this range, and morphs to the new data.', art: 'line', eyebrow: 'Chart', label: 'Active users' },
  { route: 'overview', target: 'funnel', title: 'Find the drop-off', sub: 'See how many people make it from one step to the next.', art: 'funnel', eyebrow: 'Funnel', label: 'Landing → Checkout' },
  { route: 'agent', target: 'composer', title: 'Ask Ferno', sub: 'Ask in plain words. The agent runs the queries and answers with a chart.', art: 'agent', eyebrow: 'Agent', label: 'New chat' },
  { route: 'heatmaps', target: 'heat', title: 'See where people click', sub: 'Pick a page to see clicks, rage clicks and movement.', art: 'heat', eyebrow: 'Heatmap', label: '/pricing' },
  { route: 'reports', target: 'reports', title: 'Read the reports', sub: 'Ferno looks into changes on its own. Each report shows what changed, why, and how sure it is.', art: 'report', eyebrow: 'Reports', label: 'Investigations' },
  { route: null, target: 'dock', title: 'Try every state', sub: 'Switch the data between filled, loading and empty to see how each screen copes.', art: 'fill', eyebrow: 'Chart', label: 'Website traffic' },
]

/* ───────── The card (Figma 230:35347) ───────── */
export function TipCard({ tip, size, footer, id }: { tip: TipDef; size: 'tour' | 'hover'; footer?: ReactNode; id?: string }) {
  const w = size === 'tour' ? 224 : 196 // the front card's content width
  return (
    <div className={'tip-card tip-' + size} role={size === 'tour' ? 'dialog' : 'tooltip'} id={id} aria-label={size === 'tour' ? tip.title : undefined}>
      <div className="tip-head">
        <p className="tip-title">{tip.title}</p>
        <p className="tip-sub">{tip.sub}</p>
      </div>
      <TipArt kind={tip.art} eyebrow={tip.eyebrow} label={tip.label} set={tip.set} w={w} />
      {footer && <div className="tip-foot">{footer}</div>}
    </div>
  )
}

/* ───────── Placement ─────────
 * Fixed-position card beside a rect: below, else above, else right, else
 * left; always clamped inside the viewport with an 8px edge. */
type Pos = { top: number; left: number; side: 'below' | 'above' | 'right' | 'left' }
function place(r: DOMRect, cw: number, ch: number, gap: number, prefer: 'below' | 'right' = 'below'): Pos {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight, e = 8
  const clampX = (x: number) => Math.min(Math.max(e, x), vw - cw - e)
  const clampY = (y: number) => Math.min(Math.max(e, y), vh - ch - e)
  const below = vh - r.bottom - gap - e >= ch, above = r.top - gap - e >= ch
  const right = vw - r.right - gap - e >= cw, left = r.left - gap - e >= cw
  const order: Pos['side'][] = prefer === 'right' ? ['right', 'below', 'above', 'left'] : ['below', 'above', 'right', 'left']
  const fits = { below, above, right, left }
  const side = order.find((s) => fits[s])
  if (side === 'below') return { side, top: r.bottom + gap, left: clampX(r.left) }
  if (side === 'above') return { side, top: r.top - gap - ch, left: clampX(r.left) }
  if (side === 'right') return { side, top: clampY(r.top), left: r.right + gap }
  if (side === 'left') return { side, top: clampY(r.top), left: r.left - gap - cw }
  // nothing fits (a tall target on a short screen): sit over its lower edge
  return { side: 'above', top: clampY(Math.min(r.bottom, vh) - ch - 16), left: clampX(r.right - cw - 16) }
}

/* ───────── Info tip ─────────
 * An (i) beside a card title. Hover waits 250ms so passing over it does
 * nothing; focus opens at once; a tap toggles it. The card keeps itself open
 * while the pointer is on it, and closes 120ms after the pointer leaves both. */
export function InfoTip({ id }: { id: TipId }) {
  const tip = TIPS[id]
  const btn = useRef<HTMLButtonElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false) // mounted (kept through the exit)
  const [pos, setPos] = useState<Pos | null>(null)
  const t = useRef(0)
  const domId = 'tip-' + id

  const show = (delay: number) => { clearTimeout(t.current); t.current = window.setTimeout(() => setOpen(true), delay) }
  const hide = (delay = 120) => { clearTimeout(t.current); t.current = window.setTimeout(() => setOpen(false), delay) }
  useEffect(() => () => clearTimeout(t.current), [])

  useEffect(() => {
    if (open) { setShown(true); return }
    const x = setTimeout(() => { setShown(false); setPos(null) }, 120)
    return () => clearTimeout(x)
  }, [open])

  const measure = useCallback(() => {
    const r = btn.current?.getBoundingClientRect(), c = card.current
    if (!r || !c) return
    if (r.bottom < 0 || r.top > window.innerHeight) { setOpen(false); return }
    setPos(place(r, c.offsetWidth, c.offsetHeight, 8))
  }, [])
  useLayoutEffect(() => {
    if (!shown) return
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => { window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure) }
  }, [shown, measure])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const down = (e: PointerEvent) => { if (!btn.current?.contains(e.target as Node) && !card.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', k)
    document.addEventListener('pointerdown', down)
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('pointerdown', down) }
  }, [open])

  const fine = () => matchMedia('(hover: hover)').matches
  return (
    <>
      <button ref={btn} className="info-tip" aria-label={`About ${tip.title}`} aria-describedby={open ? domId : undefined} aria-expanded={open}
        onPointerEnter={() => fine() && show(250)} onPointerLeave={() => fine() && hide()}
        onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) show(0) }} onBlur={() => hide(0)}
        onClick={() => { clearTimeout(t.current); setOpen((o) => (fine() ? true : !o)) /* a mouse click never closes what hover opened */ }}>
        <Info size={14} />
      </button>
      {shown && createPortal(
        <div ref={card} className={'tip-layer' + (open && pos ? ' in' : '') + ' from-' + (pos?.side ?? 'below')}
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
          onPointerEnter={() => clearTimeout(t.current)} onPointerLeave={() => fine() && hide()}>
          <TipCard tip={tip} size="hover" id={domId} />
        </div>,
        document.body,
      )}
    </>
  )
}

/** A card title with its info tip. */
export function CardTitle({ tip, children }: { tip: TipId; children: ReactNode }) {
  return <h3 className="card-title has-tip">{children}<InfoTip id={tip} /></h3>
}

/* ───────── Guided tour ─────────
 * Walks across pages: each step opens its route, waits for its target
 * ([data-tour]) to render, scrolls it into view, spotlights it and sets the
 * card beside it. Previous / Next, ← / →, Escape to leave. */
export function Tour({ onClose }: { onClose: () => void }) {
  const { route, go } = useApp()
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  // open the step's page
  useEffect(() => { if (step.route && route !== step.route) go(step.route) }, [i]) // eslint-disable-line

  // find, scroll to, and follow the target
  useEffect(() => {
    let raf = 0, scrolled = false, prev = ''
    const t0 = performance.now()
    setRect(null)
    const tick = () => {
      // a target that never renders (an empty state, say) falls back to the page title
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
        ?? (performance.now() - t0 > 1200 ? document.querySelector<HTMLElement>('.page-header .title-row, .agent-head') : null)
      if (el) {
        if (!scrolled) { el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'instant' as ScrollBehavior }); scrolled = true }
        const r = el.getBoundingClientRect()
        const k = [r.top, r.left, r.width, r.height].map(Math.round).join()
        if (k !== prev) { prev = k; setRect(r) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step.target, i])

  useLayoutEffect(() => {
    const c = card.current
    if (!rect || !c) { setPos(null); return }
    setPos(place(rect, c.offsetWidth, c.offsetHeight, 14, rect.height > 260 && rect.width < 760 ? 'right' : 'below'))
  }, [rect, i])

  const next = useCallback(() => { if (last) onClose(); else setI((x) => x + 1) }, [last, onClose])
  const prevStep = useCallback(() => { if (i === 0) onClose(); else setI((x) => x - 1) }, [i, onClose])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft' && i > 0) prevStep()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, prevStep, onClose, i])

  // move focus into the card so keyboard users land on the controls
  useEffect(() => { if (pos) card.current?.querySelector<HTMLButtonElement>('.tip-next')?.focus({ preventScroll: true }) }, [i, !!pos]) // eslint-disable-line

  const pad = 6
  return createPortal(
    <div className="tour">
      <div className="tour-block" />
      <div className={'tour-spot' + (rect ? ' on' : '')} style={rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : undefined} />
      <div ref={card} className={'tour-card' + (pos ? ' in' : '')} style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}>
        <TipCard key={i} size="tour" tip={step} footer={
          <>
            <span className="tip-count num">{i + 1} / {STEPS.length}</span>
            <button className="tip-prev" onClick={prevStep}>{i === 0 ? 'Skip' : 'Previous'}</button>
            <button className="tip-next" onClick={next}>{last ? 'Done' : <>Next<ArrowRight size={16} /></>}</button>
          </>
        } />
      </div>
    </div>,
    document.body,
  )
}
