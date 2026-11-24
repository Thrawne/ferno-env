import { useState } from 'react'
import { Eye, MousePointerClick } from 'lucide-react'
import { Tooltip, fmtFull, useWidth } from './common'

const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)']

/** Flowing funnel: one band per step, height ∝ people, smooth hand-off between steps. */
export function Funnel({ steps, height = 300 }: { steps: { step: string; value: number }[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = steps.length
  const cw = width / Math.max(1, n)
  const bandMax = height - 70
  const mid = bandMax / 2 + 8
  const top = steps[0]?.value || 1
  const h = (v: number) => Math.max(6, (v / top) * bandMax)

  function bandPath(i: number, grow = 0) {
    const x0 = i * cw
    const x1 = x0 + cw
    const hi = h(steps[i].value) + grow
    const hp = i === 0 ? hi : h(steps[i - 1].value) + grow
    const t = cw * 0.45
    const yTopPrev = mid - hp / 2, yTop = mid - hi / 2
    const yBotPrev = mid + hp / 2, yBot = mid + hi / 2
    return [
      `M${x0},${yTopPrev}`,
      `C${x0 + t * 0.5},${yTopPrev} ${x0 + t * 0.5},${yTop} ${x0 + t},${yTop}`,
      `L${x1},${yTop}`,
      `L${x1},${yBot}`,
      `L${x0 + t},${yBot}`,
      `C${x0 + t * 0.5},${yBot} ${x0 + t * 0.5},${yBotPrev} ${x0},${yBotPrev}`,
      'Z',
    ].join(' ')
  }

  if (width > 0 && width < 560) {
    // narrow screens: same steps as a ranked list so labels never collide
    return (
      <div ref={ref} className="barlist" style={{ marginTop: 0, gap: 4 }}>
        {steps.map((s, i) => (
          <div key={s.step} className="barlist-row" style={{ height: 44 }}>
            <span className="fill" style={{ width: `${(s.value / top) * 100}%`, background: COLORS[i % 5], opacity: 0.16, animationDelay: `${i * 60}ms` }} />
            <span className="swatch" style={{ background: COLORS[i % 5], width: 10, height: 10, borderRadius: 3 }} />
            <span className="lbl mono">{s.step}</span>
            <span className="val num">{fmtFull(s.value)}</span>
            <span className="pct">{((s.value / top) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="chart chart-enter" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Conversion funnel">
          {steps.map((s, i) => (
            <g key={s.step} opacity={hover === null || hover === i ? 1 : 0.5} style={{ transition: 'opacity .2s' }}>
              {i > 0 && <line x1={i * cw} x2={i * cw} y1={0} y2={height - 40} stroke="var(--grid)" />}
              <path d={bandPath(i, 14)} fill={COLORS[i % 5]} opacity={0.1} />
              <path d={bandPath(i)} fill={COLORS[i % 5]} opacity={0.88}
                style={{ transformOrigin: `${i * cw}px ${mid}px`, animation: `fn-in .8s cubic-bezier(.23,1,.32,1) ${i * 90}ms both` }} />
            </g>
          ))}
          {steps.map((_, i) => (
            <rect key={'h' + i} x={i * cw} y={0} width={cw} height={height - 40} fill="transparent"
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
          ))}
        </svg>
      )}
      {width > 0 && steps.map((s, i) => (
        <div key={s.step} style={{ position: 'absolute', left: i * cw, width: cw, top: mid - 12, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(255,255,255,.94)', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', boxShadow: '0 1px 2px #17171714', whiteSpace: 'nowrap' }}>
            {fmtFull(s.value)} <span style={{ color: 'var(--subtle)' }}>{((s.value / top) * 100).toFixed(1)}%</span>
          </span>
        </div>
      ))}
      {width > 0 && steps.map((s, i) => (
        <div key={'l' + s.step} style={{ position: 'absolute', left: i * cw, width: cw, bottom: 4, display: 'flex', justifyContent: 'center', color: 'var(--n-700)', fontSize: 12, gap: 6, alignItems: 'center', padding: '0 8px' }}>
          {s.step.startsWith('/') ? <Eye size={14} color="var(--n-500)" /> : <MousePointerClick size={14} color="var(--n-500)" />}
          <span className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.step}</span>
        </div>
      ))}
      {hover !== null && width > 0 && (
        <Tooltip x={hover * cw + cw / 2} y={20} w={width} visible>
          <div className="tt-title">Step {hover + 1} · {steps[hover].step}</div>
          <div className="tt-row">People<span className="v">{fmtFull(steps[hover].value)}</span></div>
          {hover > 0 && <>
            <div className="tt-row">From previous<span className="v">{((steps[hover].value / steps[hover - 1].value) * 100).toFixed(1)}%</span></div>
            <div className="tt-row" style={{ color: 'var(--danger-ink)' }}>Dropped off<span className="v">−{fmtFull(steps[hover - 1].value - steps[hover].value)}</span></div>
          </>}
        </Tooltip>
      )}
      <style>{`@keyframes fn-in { from { transform: scaleY(0.2); opacity: 0; } }`}</style>
    </div>
  )
}
