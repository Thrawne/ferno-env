import { useId, useMemo, useState } from 'react'
import { area, line, curveMonotoneX } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import { Tooltip, fmt, fmtFull, niceTicks, smooth, tickIndexes, useWidth, type Series } from './common'

type Props = {
  series: Series[]
  labels: string[]
  height?: number
  format?: (n: number) => string
  fillFirstOnly?: boolean
}

/** Smooth multi-series area/line chart with crosshair + tooltip. One y-axis. */
export function AreaChart({ series, labels, height = 280, format = fmtFull, fillFirstOnly }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')
  const pad = { t: 12, r: 52, b: 28, l: 0 }
  const iw = Math.max(0, width - pad.l - pad.r)
  const ih = height - pad.t - pad.b
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const ticks = niceTicks(max, 4)
  const y = scaleLinear().domain([0, ticks[ticks.length - 1]]).range([ih, 0])
  const x = scaleLinear().domain([0, labels.length - 1]).range([0, iw])

  const paths = useMemo(() => series.map((s) => {
    const ln = line<number>().x((_, i) => x(i)).y((v) => y(v)).curve(curveMonotoneX)(s.values) ?? ''
    const ar = area<number>().x((_, i) => x(i)).y0(ih).y1((v) => y(v)).curve(curveMonotoneX)(s.values) ?? ''
    return { ln, ar }
  }), [series, iw, ih]) // eslint-disable-line

  const xt = tickIndexes(labels.length, width < 520 ? 4 : 7)

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const i = Math.round(x.invert(e.clientX - r.left))
    setHover(Math.max(0, Math.min(labels.length - 1, i)))
  }

  return (
    <div ref={ref} className="chart chart-enter" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={series.map((s) => s.label).join(', ') + ' over time'}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
            <clipPath id={`clip-${uid}`}>
              <rect x={-4} y={-10} height={ih + 20} width={iw + 8}
                style={{ transformBox: 'fill-box', transformOrigin: 'left', animation: 'reveal-x .5s cubic-bezier(.23,1,.32,1) both' }} />
            </clipPath>
          </defs>
          <g transform={`translate(${pad.l},${pad.t})`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={0} x2={iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text className="axis-text" x={iw + 10} y={y(t) + 4}>{fmt(t)}</text>
              </g>
            ))}
            {xt.map((i) => (
              <text key={i} className="axis-text" x={x(i)} y={ih + 20} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>{labels[i]}</text>
            ))}
            <g clipPath={`url(#clip-${uid})`}>
              {paths.map((p, i) => (!fillFirstOnly || i === 0) && !series[i].dashed && (
                <path key={'a' + i} d={p.ar} fill={`url(#g-${uid}-${series[i].key})`} />
              ))}
              {paths.map((p, i) => (
                <path key={'l' + i} d={p.ln} fill="none" stroke={series[i].color} strokeWidth={2} strokeLinecap="round"
                  strokeDasharray={series[i].dashed ? '4 4' : undefined} opacity={series[i].dashed ? 0.9 : 1} />
              ))}
            </g>
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={ih} stroke="var(--n-300)" />
                {series.map((s) => (
                  <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
                ))}
              </g>
            )}
            <rect width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ cursor: 'crosshair' }} />
          </g>
        </svg>
      )}
      {hover !== null && (
        <Tooltip x={x(hover) + pad.l} y={Math.max(0, y(Math.max(...series.map((s) => s.values[hover]))) - 20)} w={width} visible>
          <div className="tt-title">{labels[hover]}</div>
          {series.map((s) => (
            <div className="tt-row" key={s.key}>
              <span className="swatch" style={{ background: s.color, opacity: s.dashed ? 0.6 : 1 }} />
              {s.label}
              <span className="v">{format(s.values[hover])}</span>
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  )
}

/** Calm sparkline for KPI tiles: smoothed, full-width strip, a still end dot (no pulse: several tiles pulsing at once competes for attention). Decorative — the number carries the value. */
export function Sparkline({ values, color = '#d97706', height = 40 }: { values: number[]; color?: string; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const uid = useId().replace(/:/g, '')
  const v = smooth(values, 10)
  const max = Math.max(...v), min = Math.min(...v)
  const pad = (max - min) * 0.15 || 1
  const x = scaleLinear().domain([0, v.length - 1]).range([2, Math.max(2, width - 6)])
  const y = scaleLinear().domain([min - pad, max + pad]).range([height - 2, 4])
  const ln = line<number>().x((_, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX)(v) ?? ''
  const ar = area<number>().x((_, i) => x(i)).y0(height).y1((d) => y(d)).curve(curveMonotoneX)(v) ?? ''
  const ex = x(v.length - 1), ey = y(v[v.length - 1])
  return (
    <div ref={ref} className="kpi-spark" aria-hidden style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height}>
          <defs>
            <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`spm-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity={0} />
              <stop offset="30%" stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`m-${uid}`}><rect width={width} height={height} fill={`url(#spm-${uid})`} /></mask>
          </defs>
          <g mask={`url(#m-${uid})`}>
            <path d={ar} fill={`url(#sp-${uid})`} />
            <path d={ln} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
          </g>
          <circle cx={ex} cy={ey} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />
        </svg>
      )}
    </div>
  )
}
