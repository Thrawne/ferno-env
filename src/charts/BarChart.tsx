import { useState } from 'react'
import { TextMorph } from 'torph/react'
import { scaleBand, scaleLinear } from 'd3-scale'
import { Tooltip, fmt, fmtFull, niceTicks, tickIndexes, useWidth, type Series } from './common'

/** Rect with only the top corners rounded. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

type Props = { series: Series[]; labels: string[]; height?: number; hidden?: Set<string> }

/** Stacked bars, 2px surface gap between segments, rounded data-end. */
export function StackedBars({ series, labels, height = 280, hidden }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const vis = series.filter((s) => !hidden?.has(s.key))
  const pad = { t: 12, r: 52, b: 28, l: 0 }
  const iw = Math.max(0, width - pad.r)
  const ih = height - pad.t - pad.b
  const totals = labels.map((_, i) => vis.reduce((a, s) => a + s.values[i], 0))
  const ticks = niceTicks(Math.max(1, ...totals), 4)
  const y = scaleLinear().domain([0, ticks[ticks.length - 1]]).range([ih, 0])
  const x = scaleBand<number>().domain(labels.map((_, i) => i)).range([0, iw]).paddingInner(labels.length > 40 ? 0.25 : 0.38).paddingOuter(0.1)
  const bw = x.bandwidth()
  const xt = tickIndexes(labels.length, width < 520 ? 4 : 7)

  return (
    <div ref={ref} className="chart chart-enter" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`Stacked bars: ${vis.map((s) => s.label).join(', ')}`}>
          <g transform={`translate(${pad.l},${pad.t})`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text className="axis-text" x={iw + 10} y={y(t) + 4}>{fmt(t)}</text>
              </g>
            ))}
            {xt.map((i) => (
              <text key={i} className="axis-text" x={(x(i) ?? 0) + bw / 2} y={ih + 20} textAnchor="middle"
                style={{ fill: hover === i ? 'var(--fg)' : undefined, fontWeight: hover === i ? 500 : undefined }}>{labels[i]}</text>
            ))}
            {labels.map((_, i) => {
              let acc = 0
              const x0 = x(i) ?? 0
              // every series keeps its segment; hidden ones shrink to 0 so toggling morphs
              const segs = series.map((s, si) => {
                const off = !!hidden?.has(s.key)
                const v = off ? 0 : s.values[i]
                const y1 = y(acc + v)
                const y0 = y(acc)
                acc += v
                const above = series.slice(si + 1).filter((n) => !hidden?.has(n.key))
                const isTop = above.every((n) => n.values[i] === 0)
                const gap = acc - v > 0 ? 2 : 0
                const h = Math.max(0, y0 - y1 - gap)
                const d = topRounded(x0, y1, bw, h, isTop ? 4 : 0)
                return <path key={s.key} fill={s.color} style={{ d: `path('${d}')`, transition: 'd .55s cubic-bezier(.23,1,.32,1)' } as React.CSSProperties} />
              })
              return (
                <g key={i} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: 'opacity .15s' }}>
                  <g style={{ transformOrigin: `0 ${ih}px`, animation: `bar-grow .7s cubic-bezier(.23,1,.32,1) ${i * (300 / labels.length)}ms both` }}>{segs}</g>
                </g>
              )
            })}
            {totals.length > 0 && (
              <line x1={0} x2={iw} y1={y(totals[totals.length - 1])} y2={y(totals[totals.length - 1])}
                stroke="var(--accent-400)" strokeDasharray="3 4" opacity={0.7} pointerEvents="none" />
            )}
            {labels.map((_, i) => (
              <rect key={'h' + i} x={(x(i) ?? 0) - (x.step() - bw) / 2} y={0} width={x.step()} height={ih} fill="transparent"
                onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
            ))}
          </g>
        </svg>
      )}
      {width > 0 && totals.length > 0 && (
        <span className="lv-badge" style={{ top: pad.t + y(totals[totals.length - 1]), right: 2 }}>{fmt(totals[totals.length - 1])}</span>
      )}
      {hover !== null && (
        <Tooltip x={(x(hover) ?? 0) + bw} y={Math.max(0, y(totals[hover]) - 10)} w={width} visible>
          <div className="tt-title">{labels[hover]}</div>
          {[...vis].reverse().map((s) => (
            <div className="tt-row" key={s.key}>
              <span className="swatch" style={{ background: s.color }} />{s.label}<span className="v">{fmtFull(s.values[hover])}</span>
            </div>
          ))}
          {vis.length > 1 && (
            <div className="tt-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
              Total<span className="v">{fmtFull(totals[hover])}</span>
            </div>
          )}
        </Tooltip>
      )}
      <style>{`@keyframes bar-grow { from { transform: scaleY(0); } }`}</style>
    </div>
  )
}

/**
 * 100% share bar with 2px gaps + legend rows. Segments and rows are fixed
 * slots, so switching tabs slides the segments to their new shares and morphs
 * each row's label and percentage instead of rebuilding.
 */
export function ShareBar({ items, slots }: { items: { label: string; value: number; color: string; icon?: React.ReactNode; iconKey?: string }[]; slots?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = items.reduce((a, b) => a + b.value, 0)
  const n = Math.max(slots ?? 0, items.length)
  const slotsArr = Array.from({ length: n }, (_, i) => items[i])
  return (
    <div className="chart-enter">
      <div style={{ display: 'flex', height: 14, margin: '20px 0 20px' }}>
        {slotsArr.map((it, i) => (
          <div key={i} onPointerEnter={() => it && setHover(i)} onPointerLeave={() => setHover(null)}
            title={it ? `${it.label}: ${it.value}%` : undefined}
            style={{
              flexGrow: it ? it.value : 0, flexBasis: 0, minWidth: 0, marginLeft: i && it ? 2 : 0,
              background: it?.color ?? 'transparent', borderRadius: 4,
              opacity: hover === null || hover === i ? 1 : 0.4,
              transition: 'opacity .15s, flex-grow .6s cubic-bezier(.23,1,.32,1), margin .6s cubic-bezier(.23,1,.32,1)',
            }} />
        ))}
      </div>
      <div style={{ display: 'grid' }}>
        {slotsArr.map((it, i) => (
          <div key={i} className="barlist-slot" data-on={!!it}>
            <div className="barlist-row" onPointerEnter={() => it && setHover(i)} onPointerLeave={() => setHover(null)}
              style={{ background: hover === i ? 'var(--n-75)' : undefined, height: 34 }}>
              <span className="swatch" style={{ background: it?.color ?? PALETTE_FALLBACK, width: 10, height: 10, borderRadius: 3 }} />
              {it?.icon && <span className="slot-icon" key={it.iconKey ?? it.label}>{it.icon}</span>}
              <span className="lbl"><TextMorph>{it?.label ?? ''}</TextMorph></span>
              <span className="val num"><TextMorph numbers>{it ? `${((it.value / total) * 100).toFixed(1)}%` : '0.0%'}</TextMorph></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
const PALETTE_FALLBACK = 'var(--n-200)'
