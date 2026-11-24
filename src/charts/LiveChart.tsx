import { useEffect, useMemo, useRef, useState } from 'react'
import { Liveline, type LivelinePoint } from 'liveline'
import { fmtFull } from './common'

/**
 * Liveline (benji.org/liveline) driven by historical data.
 *
 * Liveline plots against the wall clock. Instead of pausing it (a paused
 * Liveline stashes its data, so it can't morph, and its pause eases in so the
 * window drifts), each point sits STEP seconds apart: real time passing moves
 * the window by a negligible fraction of a point. formatTime maps the ticks
 * back to our date labels.
 *
 * When `series` values change (a tab switch), the line morphs: we tween every
 * point from its old value to its new one and feed Liveline each frame, and
 * Liveline's own range lerp rescales the axis underneath.
 * Colours must be real colour strings (Liveline derives its palette from them).
 */
export type LiveSeries = { key: string; label: string; color: string; values: number[] }

const STEP = 86_400 // one day per data point, so Liveline's own day ticks land on our points
const MORPH_MS = 650
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

function useMorph(series: LiveSeries[]) {
  const [shown, setShown] = useState(series)
  const shownRef = useRef(series)
  const latest = useRef(series)
  latest.current = series
  // callers build series inline; only morph when the numbers really change
  const key = JSON.stringify(series.map((s) => [s.key, s.label, s.values]))
  useEffect(() => {
    const series = latest.current
    const from = shownRef.current
    const to = series
    const sameShape = from.length === to.length && from.every((s, i) => s.values.length === to[i].values.length)
    if (!sameShape || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shownRef.current = to
      setShown(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / MORPH_MS)
      const k = ease(p)
      const frame = to.map((s, i) => ({ ...s, values: s.values.map((v, j) => from[i].values[j] + (v - from[i].values[j]) * k) }))
      shownRef.current = frame
      setShown(frame)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key])
  return shown
}

export function LiveChart({ series, labels, height = 280, loading, format = fmtFull, badge = true, step = STEP, referenceLine }: {
  series: LiveSeries[]; labels: string[]; height?: number; loading?: boolean; format?: (n: number) => string; badge?: boolean
  /** seconds between points; match the data's real interval so Liveline's own ticks land on points (2h data → 7200) */
  step?: number
  /** a fixed horizontal line, e.g. the baseline average, so a zoomed axis can't exaggerate a change */
  referenceLine?: { value: number; label?: string }
}) {
  const anchor = useRef(Math.floor(Date.now() / 1000)).current
  const shown = useMorph(series)
  const n = labels.length
  const start = anchor - (n - 1) * step
  const formatTime = (t: number) => labels[Math.max(0, Math.min(n - 1, Math.round((t - start) / step)))] ?? ''
  const multi = useMemo(
    () => shown.map((s) => ({
      id: s.key, label: s.label, color: s.color,
      data: s.values.map((v, i): LivelinePoint => ({ time: start + i * step, value: v })),
      value: s.values[s.values.length - 1],
    })),
    [shown, start, step],
  )
  const first = multi[0]
  return (
    // multi-series adds Liveline's toggle chips above the canvas
    <div style={{ height: height + (multi.length > 1 ? 34 : 0), display: 'flex', flexDirection: 'column' }} className="live-chart">
      <Liveline
        theme="light"
        data={first.data}
        value={first.value}
        series={multi.length > 1 ? multi : undefined}
        color={series[0].color}
        window={(n - 1) * step + step * 0.6}
        referenceLine={referenceLine}
        loading={loading}
        momentum={false}
        badge={badge}
        grid
        scrub
        fill
        pulse
        formatValue={(v) => format(Math.round(v))}
        formatTime={formatTime}
      />
    </div>
  )
}
