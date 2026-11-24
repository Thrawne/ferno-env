import { useState, type ReactNode } from 'react'
import { arc, pie } from 'd3-shape'
import { TextMorph } from 'torph/react'
import { fmtFull } from './common'

/** Donut with 2px surface gaps and a centre headline. */
export function Donut({ items, size = 180, center }: { items: { label: string; value: number; color: string }[]; size?: number; center?: ReactNode }) {
  const [hover, setHover] = useState<number | null>(null)
  const r = size / 2
  const arcs = pie<{ value: number }>().value((d) => d.value).sort(null).padAngle(0.03)(items)
  const a = arc<(typeof arcs)[number]>().innerRadius(r - 20).outerRadius(r).cornerRadius(4)
  const ah = arc<(typeof arcs)[number]>().innerRadius(r - 22).outerRadius(r + 3).cornerRadius(4)
  const total = items.reduce((s, i) => s + i.value, 0)
  const shown = hover !== null ? items[hover] : null
  return (
    <div style={{ position: 'relative', width: size, height: size }} className="chart-enter">
      <svg width={size} height={size} role="img" aria-label={items.map((i) => `${i.label} ${i.value}`).join(', ')}>
        <g transform={`translate(${r},${r})`}>
          {arcs.map((d, i) => (
            <path key={i} d={(hover === i ? ah : a)(d) ?? ''} fill={items[i].color}
              opacity={hover === null || hover === i ? 1 : 0.4} style={{ transition: 'opacity .15s' }}
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
          ))}
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
        {shown ? (
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.03em' }}>{((shown.value / total) * 100).toFixed(0)}%</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{shown.label}</div>
          </div>
        ) : center}
      </div>
    </div>
  )
}

/** Cohort retention triangle — sequential amber ramp, hover per cell. */
export function RetentionGrid({ rows }: { rows: { label: string; size: number; vals: number[] }[] }) {
  const [hover, setHover] = useState<[number, number] | null>(null)
  const weeks = rows[0]?.vals.length ?? 0
  // amber sequential: ordinal steps, lightest still visible on white
  const ramp = ['#fff5ed', '#ffe6d4', '#feceab', '#f5b07a', '#e48d42', '#d97706', '#b45309']
  const color = (v: number) => ramp[Math.min(ramp.length - 1, Math.floor((v / 100) * (ramp.length - 1) + 0.0001))]
  const ink = (v: number) => (ramp.indexOf(color(v)) >= 5 ? '#fff' : 'var(--fg)')
  const avg = Array.from({ length: weeks }, (_, w) => {
    const col = rows.filter((r) => r.vals[w] !== undefined).map((r) => r.vals[w])
    return Math.round(col.reduce((a, b) => a + b, 0) / col.length)
  })
  return (
    <div style={{ overflowX: 'auto' }} className="chart-enter">
      <table style={{ borderCollapse: 'separate', borderSpacing: 2, width: '100%', fontSize: 12, minWidth: 640 }}>
        <thead>
          <tr style={{ color: 'var(--subtle)' }}>
            <th style={{ textAlign: 'left', fontWeight: 400, padding: '0 8px 6px 0' }}>Cohort</th>
            <th style={{ textAlign: 'right', fontWeight: 400, padding: '0 12px 6px 0' }}>People</th>
            {Array.from({ length: weeks }, (_, w) => <th key={w} style={{ fontWeight: 400, paddingBottom: 6 }}>Week {w}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '0 8px 0 0', fontWeight: 500 }}>Average</td>
            <td />
            {avg.map((v, w) => (
              <td key={w} style={{ height: 32, textAlign: 'center', borderRadius: 6, background: 'var(--n-50)', fontWeight: 500 }} className="num">{v}%</td>
            ))}
          </tr>
          {rows.map((r, ri) => (
            <tr key={r.label}>
              <td style={{ padding: '0 8px 0 0', whiteSpace: 'nowrap', color: 'var(--n-700)' }}>{r.label}</td>
              <td style={{ textAlign: 'right', padding: '0 12px 0 0', color: 'var(--muted)' }} className="num">{fmtFull(r.size)}</td>
              {Array.from({ length: weeks }, (_, w) => {
                const v = r.vals[w]
                const on = hover && hover[0] === ri && hover[1] === w
                return (
                  <td key={w} onPointerEnter={() => v !== undefined && setHover([ri, w])} onPointerLeave={() => setHover(null)}
                    title={v !== undefined ? `${r.label} cohort · week ${w}: ${v}% (${Math.round((r.size * v) / 100)} people)` : undefined}
                    style={{
                      height: 32, textAlign: 'center', borderRadius: 6, background: v === undefined ? 'transparent' : color(v), color: v === undefined ? undefined : ink(v),
                      boxShadow: on ? 'inset 0 0 0 2px var(--n-900)' : undefined, animation: v !== undefined ? `px-in .45s cubic-bezier(.23,1,.32,1) ${(ri + w) * 35}ms both` : undefined,
                      ['--o' as string]: 1,
                    }} className="num">
                    {v !== undefined ? `${v}%` : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Ranked list where each row's background bar is its share of the max.
 * Rows are fixed slots: switching tabs morphs each slot in place (label text
 * morphs, bar slides to its new width, the number rolls) instead of rebuilding
 * the list. Pass `slots` (the longest list across tabs) so missing rows collapse.
 */
export function BarList({ rows, head, slots, mono }: { mono?: boolean; rows: { key: string; label: ReactNode; text?: string; value: number; icon?: ReactNode; iconKey?: string }[]; head: [string, string]; slots?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const total = rows.reduce((a, r) => a + r.value, 0)
  const n = Math.max(slots ?? 0, rows.length)
  return (
    <div className="barlist">
      <div className="barlist-head"><span><TextMorph>{head[0]}</TextMorph></span><span>{head[1]}</span></div>
      {Array.from({ length: n }, (_, i) => {
        const r = rows[i]
        const on = !!r
        return (
          <div className="barlist-slot" key={i} data-on={on}>
            <div className="barlist-row">
              <span className="fill" style={{ width: on ? `${(r.value / max) * 100}%` : '0%', animationDelay: `${i * 40}ms` }} />
              {r?.icon && <span className="slot-icon" key={r.iconKey ?? r.key}>{r.icon}</span>}
              <span className="lbl">{r?.text !== undefined ? <TextMorph className={mono ? 'mono' : undefined}>{r.text}</TextMorph> : (r?.label ?? '')}</span>
              <span className="val"><MorphNumber value={on ? r.value : 0} /></span>
              <span className="pct"><MorphNumber value={on ? (r.value / total) * 100 : 0} suffix="%" /></span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** A number that rolls to its new value by place (torph). */
export function MorphNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const txt = value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  return <TextMorph numbers>{txt}</TextMorph>
}
