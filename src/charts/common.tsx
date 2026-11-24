import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  : n.toLocaleString('en-US')

export const fmtFull = (n: number) => n.toLocaleString('en-US')

/** Nice tick values for a 0..max domain. */
export function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0]
  const raw = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = 0; v <= top + 1e-9; v += step) out.push(+v.toFixed(6))
  return out
}

/** Pick ~n evenly spaced label indexes. */
export function tickIndexes(len: number, n: number) {
  if (len <= n) return Array.from({ length: len }, (_, i) => i)
  const step = (len - 1) / (n - 1)
  return Array.from({ length: n }, (_, i) => Math.round(i * step))
}

export function Tooltip({ x, y, w, children, visible }: { x: number; y: number; w: number; children: ReactNode; visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tw, setTw] = useState(170)
  useEffect(() => { if (ref.current) setTw(ref.current.offsetWidth) })
  const left = x + 16 + tw > w ? x - tw - 16 : x + 16
  return (
    <div ref={ref} className="tooltip" style={{ left, top: y, opacity: visible ? 1 : 0 }}>
      {children}
    </div>
  )
}

export type Series = { key: string; label: string; color: string; values: number[]; dashed?: boolean }

/** Animated count-up for headline numbers. */
export function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(target)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(a + (target - a) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

/** Centered moving average — calms noisy long ranges for small charts. */
export function smooth(values: number[], target = 12) {
  const w = Math.max(1, Math.round(values.length / target))
  if (w <= 1) return values
  return values.map((_, i) => {
    const a = Math.max(0, i - w), b = Math.min(values.length, i + w + 1)
    const seg = values.slice(a, b)
    return seg.reduce((x, y) => x + y, 0) / seg.length
  })
}
