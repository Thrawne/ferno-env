import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, CircleHelp } from 'lucide-react'
import { RANGES, RANGE_LABEL, type Range } from '../data'
import { Sparkline } from '../charts/AreaChart'
import { useCountUp } from '../charts/common'

/* ───────── App state ───────── */
export type Mode = 'filled' | 'loading' | 'empty'
type Ctx = {
  route: string; go: (r: string) => void
  range: Range; setRange: (r: Range) => void
  mode: Mode; setMode: (m: Mode) => void
  loading: boolean
  collapsed: boolean; setCollapsed: (c: boolean) => void
}
export const AppCtx = createContext<Ctx>(null!)
export const useApp = () => useContext(AppCtx)

/* ───────── Ferno mark — exported from Figma (Ferno/Sidebar › Ferno Agent icon) ───────── */
export function FernoMark({ size = 18, animate = false }: { size?: number; animate?: boolean }) {
  return <img src="/brand/ferno-agent.svg" width={size} height={size} alt="" aria-hidden className={animate ? 'mark-think' : undefined} style={{ flexShrink: 0 }} />
}

/* ───────── Popover ─────────
 * Every dropdown renders here, in a fixed layer on <body>, so no card's
 * overflow can crop it. It measures its trigger and:
 *  - opens below, or flips above when there isn't room below (and more above);
 *  - caps its height to the space it has and scrolls inside past that;
 *  - stays inside the viewport horizontally;
 *  - follows the trigger while anything scrolls or resizes, and closes once the
 *    trigger scrolls out of view.
 * Motion: scales in from the edge it opens from (150ms ease-out), exits
 * faster (100ms) so it never lingers over what you're doing next.
 */
type Place = { top: number; left: number; minWidth: number; maxHeight: number; up: boolean }

export function Popover({ anchor, open, onClose, align = 'start', matchWidth = true, minWidth = 0, label, children }: {
  anchor: RefObject<HTMLElement | null>; open: boolean; onClose: () => void
  align?: 'start' | 'end'; matchWidth?: boolean; minWidth?: number; label?: string; children: ReactNode
}) {
  const menu = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const [place, setPlace] = useState<Place | null>(null)

  // keep it mounted through the exit animation
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => { setMounted(false); setClosing(false); setPlace(null) }, 100)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line

  const measure = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect()
    const m = menu.current
    if (!a || !m) return
    const vw = document.documentElement.clientWidth, vh = window.innerHeight
    const gap = 6, edge = 8
    // trigger scrolled out of view: close rather than float over nothing
    if (a.bottom < 0 || a.top > vh) { onClose(); return }
    const natural = m.scrollHeight
    const below = vh - a.bottom - gap - edge
    const above = a.top - gap - edge
    const up = natural > below && above > below
    const maxHeight = Math.max(96, Math.min(natural, up ? above : below))
    const width = Math.max(m.offsetWidth, matchWidth ? a.width : 0, minWidth)
    let left = align === 'end' ? a.right - width : a.left
    left = Math.min(Math.max(edge, left), vw - width - edge)
    const top = up ? a.top - gap - maxHeight : a.bottom + gap
    setPlace({ top, left, minWidth: Math.max(matchWidth ? a.width : 0, minWidth), maxHeight, up })
  }, [anchor, align, matchWidth, minWidth, onClose])

  useLayoutEffect(() => {
    if (!mounted || closing) return
    measure()
    let raf = 0
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    window.addEventListener('scroll', on, true)
    window.addEventListener('resize', on)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on, true); window.removeEventListener('resize', on) }
  }, [mounted, closing, measure])

  // outside press and Escape close it; the menu itself counts as inside
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchor.current?.contains(t) || menu.current?.contains(t)) return
      onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); anchor.current?.querySelector<HTMLElement>('button')?.focus() } }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [open, onClose, anchor])

  if (!mounted) return null
  return createPortal(
    <div ref={menu} role="listbox" aria-label={label}
      className={'menu pop' + (place?.up ? ' pop-up' : ' pop-down') + (align === 'end' ? ' pop-end' : '') + (closing ? ' pop-out' : '')}
      style={{
        top: place?.top ?? -9999, left: place?.left ?? -9999, minWidth: place?.minWidth,
        maxHeight: place?.maxHeight, visibility: place ? 'visible' : 'hidden',
      }}>
      {children}
    </div>,
    document.body,
  )
}

/* ───────── Dropdown select ───────── */
export function Select<T extends string>({ value, options, onChange, placeholder, label, align, width, icon }: {
  value: T | null; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void
  placeholder?: string; label?: (v: T) => ReactNode; align?: 'right'; width?: number | string; icon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const cur = options.find((o) => o.value === value)
  return (
    <div className="select-wrap" ref={ref} style={{ width }}>
      <button className="select-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} data-open={open || undefined}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {icon}
          {cur ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label ? label(cur.value) : cur.label}</span> : <span className="ph">{placeholder}</span>}
        </span>
        <ChevronsUpDown size={14} />
      </button>
      <Popover anchor={ref} open={open} onClose={close} align={align === 'right' ? 'end' : 'start'} label={placeholder}>
        {options.length === 0 && <div className="menu-empty">Nothing here yet</div>}
        {options.map((o) => (
          <button key={o.value} className="menu-item" role="option" aria-selected={o.value === value}
            onClick={() => { onChange(o.value); setOpen(false) }}>
            {o.label}
            {o.value === value && <Check size={15} strokeWidth={2.5} className="check" />}
          </button>
        ))}
      </Popover>
    </div>
  )
}

export function RangeSelect() {
  const { range, setRange } = useApp()
  return (
    <Select value={range} align="right" onChange={setRange}
      options={RANGES.map((r) => ({ value: r, label: RANGE_LABEL[r] }))} />
  )
}

/* ───────── Segmented control with sliding thumb ───────── */
export function Seg<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ left: 2, width: 0 })
  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLButtonElement>(`button[aria-pressed="true"]`)
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options.join()])
  return (
    <div className="seg" ref={wrap} role="group">
      <span className="seg-thumb" style={{ left: thumb.left, width: thumb.width }} />
      {options.map((o) => (
        <button key={o} aria-pressed={o === value} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

/* ───────── Pixel squares (the signature effect) ───────── */
function seeded(n: number) { const x = Math.sin(n * 999) * 10000; return x - Math.floor(x) }

/** Faint fading squares tucked in a corner. */
export function PixelCorner({ cols = 12, rows = 4, size = 10, corner = 'br', color = 'var(--accent-200)', opacity = 0.5 }: {
  cols?: number; rows?: number; size?: number; corner?: 'br' | 'tr' | 'bl'; color?: string; opacity?: number
}) {
  const cells = useMemo(() => Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols)
    const fx = corner === 'bl' ? 1 - c / cols : c / cols
    const fy = corner === 'tr' ? 1 - r / rows : r / rows
    const p = fx * 0.65 + fy * 0.35
    const on = seeded(i + cols * 7 + rows) < p * 0.95
    return on ? (0.25 + seeded(i * 3.1) * 0.75) * p : 0
  }), [cols, rows, corner])
  const pos = corner === 'br' ? { right: 0, bottom: 0 } : corner === 'tr' ? { right: 0, top: 0 } : { left: 0, bottom: 0 }
  return (
    <div className="pixels" aria-hidden style={{ ...pos, gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridAutoRows: size, opacity }}>
      {cells.map((o, i) => <i key={i} style={{ opacity: o, background: color }} />)}
    </div>
  )
}

/** Loading: squares fill in across the area as data "arrives". */
export function PixelLoader({ size = 18 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ c: 0, r: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (el) setDims({ c: Math.ceil(el.clientWidth / size), r: Math.ceil(el.clientHeight / size) })
  }, [size])
  return (
    <div ref={ref} className="pixel-loader" aria-label="Loading" style={{ gridTemplateColumns: `repeat(${dims.c}, ${size}px)`, gridAutoRows: size, gap: 2 }}>
      {Array.from({ length: dims.c * dims.r }, (_, i) => {
        const c = i % dims.c, r = Math.floor(i / dims.c)
        const s = seeded(i + 1)
        const show = s < 0.45 * (1 - r / (dims.r + 2)) + 0.1
        return <i key={i} style={{ visibility: show ? 'visible' : 'hidden', animationDelay: `${(c / dims.c) * 900 + s * 400}ms`, ['--o' as string]: 0.35 + s * 0.5 }} />
      })}
    </div>
  )
}

/* ───────── Empty state ───────── */
export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: string; sub: string }) {
  return (
    <div className="empty">
      <div>
        <div className="empty-ico">{icon ?? <PeopleIcon />}</div>
        <div className="empty-title">{title}</div>
        <div className="empty-sub">{sub}</div>
      </div>
    </div>
  )
}
export function PeopleIcon() {
  return (
    <svg width="34" height="28" viewBox="0 0 34 28" aria-hidden>
      <circle cx="17" cy="7" r="5" fill="var(--accent-300)" />
      <circle cx="8" cy="9" r="3.5" fill="var(--accent-200)" />
      <circle cx="26" cy="9" r="3.5" fill="var(--accent-200)" />
      <ellipse cx="17" cy="21" rx="11" ry="5" fill="var(--accent-300)" />
      <ellipse cx="17" cy="17" rx="6" ry="2.5" fill="var(--accent-200)" />
    </svg>
  )
}

/** Card body that swaps between loading / empty / content. */
export function Body({ height, empty, children }: { height: number; empty: { title: string; sub: string; icon?: ReactNode }; children: ReactNode }) {
  const { mode, loading } = useApp()
  if (loading) return <div style={{ position: 'relative', height }}><PixelLoader /></div>
  if (mode === 'empty') return <div style={{ height }}><EmptyState {...empty} /></div>
  return <>{children}</>
}

/* ───────── KPI tile ───────── */
export function Kpi({ icon, label, value, format, delta, foot, spark, sparkColor }: {
  icon: ReactNode; label: string; value: number; format: (n: number) => string; delta?: number; foot: string; spark?: number[]; sparkColor?: string
}) {
  const { mode, loading } = useApp()
  const v = useCountUp(mode === 'filled' && !loading ? value : 0)
  const empty = mode === 'empty'
  return (
    <div className={'card kpi' + (empty ? ' kpi-empty' : '')}>
      <div className="kpi-label">{icon}{label}</div>
      {loading ? (
        <>
          <div className="shimmer" style={{ height: 28, width: '45%', marginTop: 16 }} />
          <div className="shimmer" style={{ height: 12, width: '30%', margin: 'auto 0 16px' }} />
        </>
      ) : empty ? (
        <>
          <div className="kpi-value">– –</div>
          <div className="kpi-foot" style={{ marginTop: 'auto', paddingBottom: 16 }}>No data in this period</div>
          <PixelCorner />
        </>
      ) : (
        <>
          <div className="kpi-value num">
            {format(v)}
            {delta !== undefined && (
              <span className={'pill ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat')}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : ''} {Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="kpi-foot mono">{foot}</div>
          {spark && <Sparkline values={spark} color={sparkColor} />}
        </>
      )}
    </div>
  )
}

export function Banner() {
  const { mode, range } = useApp()
  if (mode !== 'empty') return null
  return (
    <div className="group-banner">
      <CircleHelp size={16} />
      <b>No activity in the {RANGE_LABEL[range].toLowerCase()}.</b> Try a longer period to check earlier activity.
    </div>
  )
}

/* ───────── Sidebar toggle ─────────
 * Lives beside each page's title. Hidden until you hover or tab into the
 * title area, then slides out and nudges the title along; while the sidebar
 * is collapsed it stays visible so you can always get it back. ⌘\ / Ctrl+\
 * toggles from anywhere. Desktop only (phones use the drawer).
 */
/** mingcute:sidebar-left-line (MingCute icon set, Apache-2.0) — the same set as the Figma sidebar. */
function SidebarLeftLine({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22 18.057c-.063 1.1-.843 1.88-1.943 1.943H3.943c-.445-.026-.846-.153-1.198-.435c-.47-.377-.711-.915-.745-1.508V5.943c.026-.445.153-.846.435-1.198c.377-.47.915-.711 1.508-.745h16.114c1.1.063 1.88.843 1.943 1.943ZM4.006 6.006v11.988L8 18V6ZM10 6v12l9.994-.006V6.006Z" />
    </svg>
  )
}

export function SidebarToggle() {
  const { collapsed, setCollapsed } = useApp()
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar'
  return (
    <span className="sb-toggle-slot">
      <button className="sb-toggle" aria-label={label} aria-pressed={collapsed} data-tip={`${label} (⌘B)`} onClick={() => setCollapsed(!collapsed)}>
        <SidebarLeftLine />
      </button>
    </span>
  )
}

export function PageHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="title-zone">
        <div className="title-row">
          <SidebarToggle />
          <h1 className="page-title">{title}</h1>
        </div>
        <p className="page-sub">{sub}</p>
      </div>
      {right}
    </div>
  )
}
