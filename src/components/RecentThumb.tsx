import { Bar, Card, Chart, Stage, type Act } from '../kit'
import './recent-thumb.css'

/**
 * Recent-thread thumbnails (Figma: Ferno · Agent › Recent threads).
 *
 * Built to the stageshow stacked-cards rules, at thumbnail scale:
 * - Two report cards of one width, the back one peeking up and right of the
 *   front one, both running off the bottom-left edge as in the Figma file.
 * - The front card is the artifact the chat produced: its chart is the only
 *   subject; the title is a filler bar (at 100px, words would be 6px type).
 * - The ground is Ferno's amber pixel grid, quiet behind the cards.
 * - Hover (play="hover"): the back card fans out and the chart eases to the
 *   finding, then settles back with a glide when the pointer leaves.
 *
 * Designed at 200 × 240 and shown at 100 × 120 (scale 0.5), the card's full
 * height, so the canvas fills its card edge to edge.
 */
export type ThumbKind = 'traffic' | 'rage' | 'pricing'

const ART: Record<ThumbKind, { kind: 'bars' | 'line'; rest: number[]; after: number[]; back: number[] }> = {
  // "What changed in my product recently?" → traffic by month, the late climb
  traffic: { kind: 'bars', rest: [6, 9, 9, 13, 16, 22, 34], after: [6, 9, 9, 13, 18, 26, 42], back: [4, 6, 5, 8, 7, 9] },
  // "Rage clicks on Export" → daily rage clicks, the mobile spike
  rage: { kind: 'bars', rest: [14, 16, 26, 30, 31, 36, 40], after: [14, 16, 30, 38, 42, 50, 56], back: [5, 7, 6, 8, 6, 7] },
  // "Pricing page spike" → visitors over 14 days
  pricing: { kind: 'line', rest: [12, 14, 13, 16, 22, 28, 34, 33, 38, 40], after: [12, 14, 13, 16, 24, 32, 40, 41, 47, 52], back: [8, 9, 8, 10, 9, 11] },
}

type S = { on: boolean }

async function script(a: Act<S>) {
  a.set({ on: true })
  await a.wait(1400)
}

// The pixel ground: amber squares in a 5 × 6 grid, warmer toward the top-right.
const PX = ['#d97706', '#e48d42', '#f5b07a', '#b45309', '#feceab']
function Ground({ seed }: { seed: number }) {
  return (
    <div className="rt-ground" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => {
        const c = i % 5, r = Math.floor(i / 5)
        const s = Math.abs(Math.sin((i + 1) * (seed + 3) * 12.9898)) % 1
        const warm = c / 4 * 0.7 + (1 - r / 5) * 0.5
        return <i key={i} style={{ background: s < warm ? PX[Math.floor(s * 7 + seed) % PX.length] : '#feceab' }} />
      })}
    </div>
  )
}

export function RecentThumb({ kind, seed = 0 }: { kind: ThumbKind; seed?: number }) {
  const art = ART[kind]
  return (
    <Stage width={200} height={240} initial={{ on: false }} poster={{ on: true }} script={script} play="hover" className="rt" accent="#d97706">
      {(s) => (
        <div className="rt-scene" data-on={s.on}>
          <Ground seed={seed} />
          <Card className="rt-card rt-back" pad="small" gap={10} lift>
            <Bar w={64} h={8} tone={2} />
            <Chart kind="bars" data={art.back} width={120} height={90} className="rt-chart rt-chart--quiet" show />
          </Card>
          <Card className="rt-card rt-front" pad="small" gap={12} lift>
            <div className="rt-head">
              <Bar w={78} h={8} tone={3} />
              <Bar w={40} h={6} tone={2} />
            </div>
            <Chart kind={art.kind} data={s.on ? art.after : art.rest} width={132} height={118} className="rt-chart" show area={art.kind === 'line'} />
          </Card>
        </div>
      )}
    </Stage>
  )
}
