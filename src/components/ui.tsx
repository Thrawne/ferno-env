import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
}
export const AppCtx = createContext<Ctx>(null!)
export const useApp = () => useContext(AppCtx)

/* ───────── Ferno mark — exported from Figma (Ferno/Sidebar › Ferno Agent icon) ───────── */
export function FernoMark({ size = 18, animate = false }: { size?: number; animate?: boolean }) {
  return <img src="/brand/ferno-agent.svg" width={size} height={size} alt="" aria-hidden className={animate ? 'mark-think' : undefined} style={{ flexShrink: 0 }} />
}

/* ───────── Dropdown select ───────── */
export function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) close() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('pointerdown', h); document.removeEventListener('keydown', k) }
  }, [open, close])
  return ref
}

export function Select<T extends string>({ value, options, onChange, placeholder, label, align, width, icon }: {
  value: T | null; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void
  placeholder?: string; label?: (v: T) => ReactNode; align?: 'right'; width?: number | string; icon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const cur = options.find((o) => o.value === value)
  return (
    <div className="select-wrap" ref={ref} style={{ width }}>
      <button className="select-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {icon}
          {cur ? <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label ? label(cur.value) : cur.label}</span> : <span className="ph">{placeholder}</span>}
        </span>
        <ChevronsUpDown size={14} />
      </button>
      {open && (
        <div className={'menu' + (align === 'right' ? ' right' : '')} role="listbox">
          {options.map((o) => (
            <button key={o.value} className="menu-item" role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false) }}>
              {o.label}
              {o.value === value && <Check size={15} strokeWidth={2.5} className="check" />}
            </button>
          ))}
        </div>
      )}
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

export function PageHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      {right}
    </div>
  )
}
