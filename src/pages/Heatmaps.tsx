import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleDashed, MousePointerClick, Move, Smartphone, Zap } from 'lucide-react'
import { HEAT_PAGES, RANGES, RANGE_LABEL } from '../data'
import { EmptyState, PageHeader, PixelCorner, PixelLoader, Select, Seg, useApp } from '../components/ui'
import { Tooltip, fmtFull } from '../charts/common'

type ModeKey = 'all' | 'clicks' | 'rage' | 'dead' | 'move'
type Spot = { x: number; y: number; w: number; label: string; kind?: 'rage' | 'dead' }

const W = 1000, H = 620

const SPOTS: Record<string, Spot[]> = {
  [HEAT_PAGES[0]]: [
    { x: 470, y: 330, w: 1, label: '“Start building” button' },
    { x: 610, y: 330, w: 0.55, label: '“See templates” button' },
    { x: 820, y: 38, w: 0.5, label: 'Sign in' },
    { x: 905, y: 38, w: 0.42, label: 'Get started (nav)' },
    { x: 380, y: 38, w: 0.3, label: 'Pricing (nav)' },
    { x: 300, y: 38, w: 0.18, label: 'Docs (nav)' },
    { x: 200, y: 500, w: 0.35, label: 'Feature card · Tokens' },
    { x: 500, y: 500, w: 0.28, label: 'Feature card · Preview' },
    { x: 800, y: 500, w: 0.22, label: 'Feature card · Export' },
    { x: 520, y: 200, w: 0.16, label: 'Headline text' },
    { x: 640, y: 255, w: 0.38, label: 'Subheading (not a link)', kind: 'dead' },
    { x: 800, y: 520, w: 0.45, label: '“Export” icon', kind: 'rage' },
  ],
  [HEAT_PAGES[1]]: [
    { x: 500, y: 470, w: 1, label: 'Pro · “Start trial”' },
    { x: 200, y: 470, w: 0.45, label: 'Free · “Get started”' },
    { x: 800, y: 470, w: 0.3, label: 'Team · “Contact sales”' },
    { x: 500, y: 150, w: 0.5, label: 'Monthly / Yearly toggle' },
    { x: 500, y: 330, w: 0.24, label: 'Pro feature list' },
    { x: 905, y: 38, w: 0.3, label: 'Get started (nav)' },
    { x: 800, y: 330, w: 0.4, label: 'Team price (not a link)', kind: 'dead' },
    { x: 500, y: 150, w: 0.5, label: 'Billing toggle', kind: 'rage' },
  ],
  [HEAT_PAGES[2]]: [
    { x: 110, y: 140, w: 0.6, label: 'Sidebar · Colours' },
    { x: 110, y: 190, w: 0.45, label: 'Sidebar · Type' },
    { x: 600, y: 300, w: 0.8, label: 'Canvas preview' },
    { x: 930, y: 40, w: 1, label: '“Export” button' },
    { x: 840, y: 40, w: 0.4, label: '“Share” button' },
    { x: 930, y: 40, w: 0.6, label: '“Export” button (mobile)', kind: 'rage' },
    { x: 600, y: 80, w: 0.3, label: 'Canvas tab label', kind: 'dead' },
  ],
}

/** Colourised density field: gaussian blobs → amber→red sequential ramp. */
function HeatCanvas({ spots, intensity }: { spots: Spot[]; intensity: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.clearRect(0, 0, W, H)
    const r = (s: Spot) => 40 + s.w * 60
    spots.forEach((s) => {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r(s))
      g.addColorStop(0, `rgba(0,0,0,${Math.min(1, s.w * intensity)})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(s.x - r(s), s.y - r(s), r(s) * 2, r(s) * 2)
      // scatter some satellite clicks around each target
      for (let k = 0; k < 10 * s.w; k++) {
        const a = (k * 2.399) % (Math.PI * 2), d = 10 + ((k * 37) % 50)
        const sx = s.x + Math.cos(a) * d, sy = s.y + Math.sin(a) * d * 0.6
        const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22)
        gg.addColorStop(0, `rgba(0,0,0,${0.18 * intensity})`)
        gg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gg
        ctx.fillRect(sx - 22, sy - 22, 44, 44)
      }
    })
    const img = ctx.getImageData(0, 0, W, H)
    const stops = [[255, 241, 224], [245, 176, 122], [217, 119, 6], [180, 35, 24]]
    for (let i = 0; i < img.data.length; i += 4) {
      const a = img.data[i + 3] / 255
      if (a < 0.02) continue
      const t = Math.min(0.999, a) * (stops.length - 1)
      const k = Math.floor(t), f = t - k
      const c0 = stops[k], c1 = stops[Math.min(stops.length - 1, k + 1)]
      img.data[i] = c0[0] + (c1[0] - c0[0]) * f
      img.data[i + 1] = c0[1] + (c1[1] - c0[1]) * f
      img.data[i + 2] = c0[2] + (c1[2] - c0[2]) * f
      img.data[i + 3] = Math.min(230, Math.pow(a, 0.8) * 330)
    }
    ctx.putImageData(img, 0, 0)
  }, [spots, intensity])
  return <canvas ref={ref} width={W} height={H} className="hm-canvas" style={{ width: '100%', height: '100%', animation: 'chart-in .6s cubic-bezier(.23,1,.32,1)' }} />
}

function Paths() {
  const paths = [
    'M80,40 C240,120 380,180 470,330 S700,460 800,520',
    'M900,40 C820,140 700,200 640,255 S520,420 500,500',
    'M300,38 C320,160 260,360 200,500',
    'M520,200 C560,260 600,300 610,330 S720,400 905,38',
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={['var(--s1)', 'var(--s2)', 'var(--s4)', 'var(--s3)'][i]} strokeWidth={2.5} strokeLinecap="round" opacity={0.8}
          strokeDasharray="1600" strokeDashoffset="1600" style={{ animation: `draw 2.4s cubic-bezier(.23,1,.32,1) ${i * 0.25}s forwards` }} />
      ))}
      <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  )
}

/** Greyscale wireframe of the captured page. */
function MockPage({ page }: { page: string }) {
  const b = (x: number, y: number, w: number, h: number, extra: React.CSSProperties = {}) =>
    <div key={`${x}-${y}-${w}`} style={{ position: 'absolute', left: x / 10 + '%', top: (y / H) * 100 + '%', width: w / 10 + '%', height: (h / H) * 100 + '%', background: '#eeeeee', borderRadius: 6, ...extra }} />
  const nav = <>
    {b(40, 26, 90, 24, { background: '#e2e2e2' })}
    {[270, 350, 430].map((x) => b(x, 30, 60, 16))}
    {b(780, 24, 80, 28, { background: '#fff', boxShadow: 'inset 0 0 0 1px #e2e2e2' })}
    {b(870, 24, 90, 28, { background: '#cfcfcf' })}
  </>
  if (page === HEAT_PAGES[1]) return <>
    {nav}
    {b(330, 100, 340, 28, { background: '#dcdcdc' })}
    {b(420, 138, 160, 28, { borderRadius: 99, background: '#e5e5e5' })}
    {[60, 360, 660].map((x, i) => <div key={x}>
      {b(x, 200, 280, 320, { background: i === 1 ? '#f4f4f4' : '#fafafa', boxShadow: `inset 0 0 0 ${i === 1 ? 2 : 1}px ${i === 1 ? '#cfcfcf' : '#ececec'}` })}
      {b(x + 24, 224, 100, 16)}
      {b(x + 24, 256, 140, 40, { background: '#e0e0e0' })}
      {[310, 336, 362, 388].map((y) => b(x + 24, y, 200, 12))}
      {b(x + 24, 450, 232, 40, { background: i === 1 ? '#c8c8c8' : '#e5e5e5' })}
    </div>)}
  </>
  if (page === HEAT_PAGES[2]) return <>
    {b(0, 0, 220, H, { background: '#f6f6f6', borderRadius: 0 })}
    {[120, 170, 220, 270, 320].map((y) => b(30, y, 160, 26))}
    {b(30, 26, 120, 26, { background: '#e2e2e2' })}
    {b(240, 24, 300, 30)}
    {b(800, 24, 80, 32, { background: '#fff', boxShadow: 'inset 0 0 0 1px #e2e2e2' })}
    {b(890, 24, 90, 32, { background: '#cfcfcf' })}
    {b(240, 70, 740, 530, { background: '#fafafa', boxShadow: 'inset 0 0 0 1px #ececec' })}
    {b(300, 130, 600, 120, { background: '#efefef' })}
    {[300, 500, 700].map((x) => b(x, 280, 180, 140, { background: '#f0f0f0' }))}
  </>
  return <>
    {nav}
    {b(220, 140, 560, 44, { background: '#dcdcdc' })}
    {b(300, 194, 400, 44, { background: '#dcdcdc' })}
    {b(330, 248, 340, 14)}
    {b(390, 310, 160, 42, { background: '#c8c8c8', borderRadius: 10 })}
    {b(560, 310, 120, 42, { background: '#fff', boxShadow: 'inset 0 0 0 1px #d9d9d9', borderRadius: 10 })}
    {[80, 380, 680].map((x) => <div key={x}>
      {b(x, 420, 240, 170, { background: '#f7f7f7', boxShadow: 'inset 0 0 0 1px #ececec' })}
      {b(x + 20, 440, 36, 36, { background: '#e6e6e6' })}
      {b(x + 20, 500, 140, 14)}
      {b(x + 20, 524, 190, 10)}
    </div>)}
  </>
}

export function Heatmaps() {
  const { mode, loading, range, setRange } = useApp()
  const [page, setPage] = useState<string | null>(HEAT_PAGES[0])
  const [hmMode, setHmMode] = useState<ModeKey>('all')
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop')
  const [hover, setHover] = useState<Spot | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState({ x: 0, y: 0 })

  const empty = mode === 'empty'
  const activePage = empty ? null : page
  const spots = activePage ? SPOTS[activePage] : []
  const total = 18420
  const counts = { clicks: 14210, rage: 312, dead: 1148, move: 4210 }
  const shown = useMemo(() => {
    if (hmMode === 'rage') return spots.filter((s) => s.kind === 'rage')
    if (hmMode === 'dead') return spots.filter((s) => s.kind === 'dead')
    return spots.filter((s) => !s.kind)
  }, [spots, hmMode])
  const markers = hmMode === 'all' ? spots.filter((s) => s.kind) : hmMode === 'rage' || hmMode === 'dead' ? shown : []

  const MODES: { k: ModeKey; icon: React.ReactNode; title: string; sub: string; n?: number; color: string }[] = [
    { k: 'clicks', icon: <MousePointerClick size={16} />, title: 'Clicks', sub: 'Where users interact', n: counts.clicks, color: 'var(--s3)' },
    { k: 'rage', icon: <Zap size={16} />, title: 'Rage clicks', sub: 'Repeated frustration', n: counts.rage, color: '#dc2626' },
    { k: 'dead', icon: <CircleDashed size={16} />, title: 'Dead clicks', sub: 'Clicks without response', n: counts.dead, color: 'var(--s4)' },
    { k: 'move', icon: <Move size={16} />, title: 'Movement', sub: 'Where attention travels', n: counts.move, color: 'var(--s2)' },
  ]

  return (
    <div className="page fade-page">
      <PageHeader title="Heatmaps" sub="See where users click, hesitate, and run into friction on each page." />
      <div className="group">
        <div className="card">
          <h3 className="card-title">Choose a page</h3>
          <p className="card-sub" style={{ margin: '4px 0 16px', fontSize: 14 }}>Viewing interactions captured by Tokencraft.</p>
          <div className="hm-selects" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, background: 'var(--n-50)', borderRadius: 10, padding: 2 }}>
            <Select value={activePage} placeholder="No pages captured" onChange={(v) => setPage(v)}
              options={empty ? [] : HEAT_PAGES.map((p) => ({ value: p, label: <span className="mono">{p}</span> }))} />
            <Select value={hmMode} onChange={setHmMode} options={[
              { value: 'all', label: 'All interactions' }, { value: 'clicks', label: 'Clicks' }, { value: 'rage', label: 'Rage clicks' },
              { value: 'dead', label: 'Dead clicks' }, { value: 'move', label: 'Movement' },
            ]} />
            <Select value={range} onChange={setRange} align="right" options={RANGES.map((r) => ({ value: r, label: RANGE_LABEL[r] }))} />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          {activePage && !loading && (
            <div className="card-head" style={{ marginBottom: 12 }}>
              <span className="num" style={{ fontWeight: 500 }}>{fmtFull(total)} <span className="card-sub" style={{ fontSize: 14 }}>interactions from 2,941 sessions</span></span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="hm-legend">Fewer<span className="ramp" />More</div>
                <Seg value={device} options={['Desktop', 'Mobile']} onChange={setDevice} />
              </div>
            </div>
          )}
          <div className="hm-stage" ref={stageRef} style={{ minHeight: activePage ? 0 : 480, padding: '1px 0' }}>
            {loading ? <PixelLoader /> : !activePage ? (
              <div style={{ height: 480 }}>
                <EmptyState icon={<HeatIcon />} title="No active users this period" sub={`No users were active in the ${RANGE_LABEL[range].toLowerCase()}. Try a longer period.`} />
              </div>
            ) : (
              <div className="hm-page" key={activePage + device} style={{ width: device === 'Desktop' ? 'min(1000px, calc(100% - 32px))' : 'min(300px, calc(100% - 32px))', aspectRatio: device === 'Desktop' ? `${W}/${H}` : '300/620', transition: 'width .4s cubic-bezier(.23,1,.32,1)' }}>
                {device === 'Desktop' ? (
                  <>
                    <MockPage page={activePage} />
                    {hmMode !== 'move' && <HeatCanvas spots={shown} intensity={hmMode === 'all' ? 1 : 1.2} />}
                    {hmMode === 'move' && <Paths />}
                    {markers.map((s, i) => (
                      <div key={i} className="hm-spot" style={{ left: s.x / 10 + '%', top: (s.y / H) * 100 + '%', width: 28, height: 28 }}>
                        {s.kind === 'rage' ? <>
                          <span className="rage-ring" />
                          <span style={{ position: 'absolute', inset: 6, borderRadius: 99, background: '#dc2626', boxShadow: '0 0 0 2px #fff' }} />
                        </> : <span style={{ position: 'absolute', inset: 4, borderRadius: 99, border: '2px dashed var(--s4)', background: 'rgba(98,80,214,.12)' }} />}
                      </div>
                    ))}
                    {(hmMode === 'move' ? [] : hmMode === 'all' ? spots : shown).map((s, i) => (
                      <div key={'h' + i} style={{ position: 'absolute', left: `calc(${s.x / 10}% - 30px)`, top: `calc(${(s.y / H) * 100}% - 30px)`, width: 60, height: 60, borderRadius: 99, cursor: 'pointer' }}
                        onPointerEnter={(e) => {
                          const r = stageRef.current!.getBoundingClientRect()
                          setTip({ x: e.clientX - r.left, y: e.clientY - r.top - 30 }); setHover(s)
                        }}
                        onPointerLeave={() => setHover(null)} />
                    ))}
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
                    <div>
                      <Smartphone size={28} color="var(--accent-400)" />
                      <div className="empty-title">Mobile capture is still collecting</div>
                      <div className="empty-sub">214 mobile sessions so far. Heatmaps unlock at 300.</div>
                      <div style={{ height: 6, background: 'var(--n-75)', borderRadius: 6, marginTop: 16, overflow: 'hidden' }}>
                        <div style={{ width: '71%', height: '100%', background: 'var(--s1)', borderRadius: 6, transformOrigin: 'left', animation: 'grow-x .9s cubic-bezier(.23,1,.32,1)' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {hover && (
              <Tooltip x={tip.x} y={tip.y} w={stageRef.current?.clientWidth ?? 800} visible>
                <div className="tt-title">{hover.kind === 'rage' ? 'Rage clicks' : hover.kind === 'dead' ? 'Dead clicks' : 'Clicks'}</div>
                <div className="tt-row" style={{ fontWeight: 500 }}>{hover.label}</div>
                <div className="tt-row">Interactions<span className="v">{fmtFull(Math.round(hover.w * (hover.kind ? 180 : 3400)))}</span></div>
                <div className="tt-row">Share of page<span className="v">{(hover.w * (hover.kind ? 2.1 : 18.5)).toFixed(1)}%</span></div>
              </Tooltip>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 14px 10px' }}>
          <div style={{ fontWeight: 500 }}>See what aggregate metrics cannot explain</div>
          <div className="card-sub" style={{ fontSize: 14, marginTop: 2 }}>
            {activePage ? 'Pick a layer to place captured behaviour over the interface your users actually saw.' : 'Select an instrumented page to place captured behaviour over the interface your users actually saw.'}
          </div>
        </div>
        <div className="grid g-4">
          {MODES.map((m) => (
            <button key={m.k} className="hm-mode" aria-pressed={hmMode === m.k} disabled={!activePage}
              onClick={() => setHmMode(hmMode === m.k ? 'all' : m.k)}>
              <span style={{ color: m.color }}>{m.icon}</span>
              <div style={{ fontWeight: 500, marginTop: 8 }}>{m.title}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}>
                <span className="card-sub">{m.sub}</span>
                {activePage && !loading && <span className="num" style={{ fontWeight: 500 }}>{fmtFull(m.n!)}</span>}
              </div>
              <PixelCorner cols={12} rows={4} size={9} color="#bbf7d0" opacity={0.45} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeatIcon() {
  return (
    <svg width="30" height="28" viewBox="0 0 30 28" aria-hidden>
      <rect x="0" y="0" width="26" height="22" rx="4" fill="var(--accent-200)" />
      <rect x="4" y="5" width="8" height="3" rx="1" fill="#fff" /><rect x="14" y="5" width="8" height="3" rx="1" fill="#fff" />
      <rect x="4" y="11" width="18" height="3" rx="1" fill="#fff" />
      <circle cx="24" cy="21" r="5.5" fill="var(--accent-300)" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}
