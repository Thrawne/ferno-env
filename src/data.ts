// Mock data for the prototype. Seeded so numbers stay stable per range.

export type Range = '24h' | '7d' | '30d' | '90d'
export const RANGE_LABEL: Record<Range, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}
export const RANGES: Range[] = ['24h', '7d', '30d', '90d']

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ───────── Projects ─────────
 * Each project scales and reseeds the same mock data, so switching projects
 * changes every number (and the charts morph to it). An empty project has no
 * events yet: the app shows its empty states and the setup flow. */
export type Project = { id: string; name: string; domain: string; k: number; seed: number; empty?: boolean }
export const PROJECTS: Project[] = [
  { id: 'tokencraft', name: 'Tokencraft', domain: 'tokencrafter.vercel.app', k: 1, seed: 0 },
  { id: 'ferno-web', name: 'Ferno web', domain: 'useferno.com', k: 0.42, seed: 31 },
  { id: 'northwind', name: 'Northwind Docs', domain: 'docs.northwind.dev', k: 2.3, seed: 57 },
  { id: 'lumen', name: 'Lumen', domain: 'lumen.app', k: 0, seed: 0, empty: true },
]
let project: Project = PROJECTS[0]
/** Set by App before each render; the data functions below read it. */
export function setDataProject(p: Project) { project = p }
/** Scale a fixed 7-day figure to the current project's size. */
export const pk = (n: number) => Math.round(n * project.k)
/** Share of visitors whose browser sent no timezone. They're counted under the project's default instead of a 100% "Unknown" row. */
export const NO_TZ_SHARE = 8

const DAY = 86400000
const TODAY = new Date('2026-11-24T14:00:00')
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtHour = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric' })

export function points(range: Range) {
  return { '24h': 24, '7d': 7, '30d': 30, '90d': 90 }[range]
}

export function labelsFor(range: Range): string[] {
  const n = points(range)
  return Array.from({ length: n }, (_, i) => {
    if (range === '24h') return fmtHour(new Date(TODAY.getTime() - (n - 1 - i) * 3600000))
    return fmtDay(new Date(TODAY.getTime() - (n - 1 - i) * DAY))
  })
}

export function rangeSpan(range: Range) {
  const l = labelsFor(range)
  return range === '24h' ? 'Today' : `${l[0]} – ${l[l.length - 1]}`
}

/** Smooth-ish series with weekly rhythm, a trend and noise. */
function series(range: Range, seed: number, base: number, trend = 0.25, spike?: number) {
  const r = rng(seed + project.seed + range.length * 97 + points(range))
  const n = points(range)
  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1)
    const weekly = range === '24h'
      ? 0.55 + 0.6 * Math.max(0, Math.sin(((i - 6) / 24) * Math.PI * 2 * 0.9))
      : 1 - 0.28 * (([0, 6].includes((i + 3) % 7)) ? 1 : 0)
    const noise = 0.85 + r() * 0.3
    const sp = spike !== undefined && i === Math.round((n - 1) * spike) ? 1.7 : 1
    return Math.max(0, Math.round(base * project.k * (1 + trend * t) * weekly * noise * sp))
  })
}

const scale = (range: Range) => ({ '24h': 0.09, '7d': 1, '30d': 1, '90d': 1 }[range])

export function analytics(range: Range) {
  const k = scale(range)
  const visitors = series(range, 11, 412 * k, 0.32, 0.72)
  const views = visitors.map((v, i) => Math.round(v * (2.6 + 0.4 * Math.sin(i))))
  const sessions = visitors.map((v, i) => Math.round(v * (1.32 + 0.1 * Math.cos(i * 1.3))))
  const prevVisitors = series(range, 23, 360 * k, 0.1)
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  return {
    visitors, views, sessions, prevVisitors,
    totals: {
      visitors: sum(visitors), views: sum(views), sessions: sum(sessions),
      bounce: 38.4, avgSession: 184, pps: +(sum(views) / sum(sessions)).toFixed(2),
    },
  }
}

export function overview(range: Range) {
  const k = scale(range)
  const active = series(range, 5, 318 * k, 0.28, 0.6)
  const returning = active.map((v, i) => Math.round(v * (0.42 + 0.05 * Math.sin(i / 2))))
  const pageviews = series(range, 7, 980 * k, 0.2)
  const clicks = series(range, 8, 640 * k, 0.15)
  const signups = series(range, 9, 42 * k, 0.1)
  const custom = series(range, 10, 210 * k, 0.3)
  return { active, returning, events: { pageviews, clicks, custom, signups } }
}

export const EVENT_SERIES = [
  { key: 'pageviews', label: 'Page views', color: 'var(--s1)' },
  { key: 'clicks', label: 'Clicks', color: 'var(--s2)' },
  { key: 'custom', label: 'Custom events', color: 'var(--s3)' },
  { key: 'signups', label: 'Sign-ups', color: 'var(--s4)' },
] as const

export const FUNNEL_EVENTS = ['/ (Landing)', '/pricing', 'signup_started', 'Signed up with Google', '/checkout', 'export_clicked', 'invite_sent']
export const DEFAULT_FUNNEL = ['/ (Landing)', '/pricing', 'signup_started', '/checkout']
/** Landing → Checkout conversion per range; the Overview KPI and the default funnel agree on it. */
export const CONVERSION: Record<Range, number> = { '24h': 16.4, '7d': 18.2, '30d': 17.6, '90d': 19.1 }

export function funnelCounts(steps: string[], range: Range) {
  const top = Math.round(12847 * project.k * ({ '24h': 0.06, '7d': 1, '30d': 3.9, '90d': 11.2 }[range]))
  const k = CONVERSION[range] / 18.2
  const drops = [1, 0.641 * Math.sqrt(k), 0.381 * k, 0.182 * k, 0.12 * k]
  return steps.map((s, i) => ({ step: s, value: Math.round(top * drops[i]) }))
}

/** Heatmap totals per captured page (7-day figures; other ranges scale). */
export const HEAT_TOTALS: Record<string, { total: number; sessions: number; clicks: number; rage: number; dead: number; move: number }> = {
  'tokencrafter.vercel.app': { total: 18420, sessions: 2941, clicks: 14210, rage: 312, dead: 1148, move: 4210 },
  'tokencrafter.vercel.app/pricing': { total: 6930, sessions: 1210, clicks: 5120, rage: 188, dead: 402, move: 1590 },
  'tokencrafter.vercel.app/app': { total: 11480, sessions: 964, clicks: 8960, rage: 241, dead: 315, move: 2480 },
}
export const RANGE_SCALE: Record<Range, number> = { '24h': 0.15, '7d': 1, '30d': 4.1, '90d': 11.8 }

export const PAGES = {
  Top: [
    ['/', 4821], ['/pricing', 2210], ['/docs/getting-started', 1544], ['/blog/design-tokens-101', 1102], ['/app', 964], ['/changelog', 512],
  ],
  Entry: [
    ['/', 3310], ['/blog/design-tokens-101', 1240], ['/pricing', 690], ['/docs/getting-started', 455], ['/templates', 301], ['/changelog', 140],
  ],
  Exit: [
    ['/pricing', 1480], ['/', 1205], ['/checkout', 870], ['/docs/getting-started', 640], ['/app', 410], ['/blog/design-tokens-101', 388],
  ],
} as Record<string, [string, number][]>

export type SourceRow = { name: string; value: number; logo?: string; icon?: 'direct' | 'campaign' }
export const SOURCES: Record<string, SourceRow[]> = {
  Sources: [
    { name: 'Direct', value: 3902, icon: 'direct' },
    { name: 'Google', value: 2460, logo: 'google' },
    { name: 'X (Twitter)', value: 1120, logo: 'x' },
    { name: 'Slack', value: 802, logo: 'slack' },
    { name: 'LinkedIn', value: 540, logo: 'linkedin' },
    { name: 'Product Hunt', value: 311, logo: 'producthunt' },
  ],
  Campaigns: [
    { name: 'launch_week', value: 1840, icon: 'campaign' },
    { name: 'newsletter_nov', value: 1210, icon: 'campaign' },
    { name: 'ph_launch', value: 612, logo: 'producthunt' },
    { name: 'retarget_q4', value: 380, logo: 'linkedin' },
    { name: 'partner_tokens', value: 214, icon: 'campaign' },
  ],
}

export const TECH: Record<string, [string, number, string][]> = {
  Devices: [['Desktop', 64.2, ''], ['Mobile', 31.1, ''], ['Tablet', 4.7, '']],
  Browsers: [['Chrome', 58.3, 'chrome'], ['Safari', 24.9, 'safari'], ['Arc', 8.4, 'arc'], ['Firefox', 5.6, 'firefox'], ['Edge', 2.8, 'edge']],
  Systems: [['macOS', 46.1, 'apple'], ['Windows', 22.4, 'windows'], ['iOS', 19.8, 'apple'], ['Android', 9.2, 'android'], ['Linux', 2.5, 'linux']],
}

export const REGION = {
  Timezones: [['🇳🇬', 'Africa/Lagos', 2140], ['🇬🇧', 'Europe/London', 1610], ['🇺🇸', 'America/New_York', 1388], ['🇮🇳', 'Asia/Kolkata', 802], ['🇩🇪', 'Europe/Berlin', 640], ['🇮🇩', 'Asia/Jakarta', 412]],
  Languages: [['🇬🇧', 'English', 6120], ['🇫🇷', 'French', 640], ['🇪🇸', 'Spanish', 518], ['🇩🇪', 'German', 402], ['🇵🇹', 'Portuguese', 300], ['🇯🇵', 'Japanese', 121]],
} as Record<string, [string, string, number][]>

export function retention() {
  const r = rng(42)
  const cohorts = 8
  return Array.from({ length: cohorts }, (_, c) => {
    const size = Math.round(180 + r() * 220)
    const weeks = cohorts - c
    const vals = Array.from({ length: weeks }, (_, w) => {
      if (w === 0) return 100
      const base = 100 * Math.pow(0.62 + c * 0.012, Math.pow(w, 0.72))
      return Math.max(4, Math.round(base * (0.92 + r() * 0.16)))
    })
    const d = new Date(TODAY.getTime() - (cohorts - 1 - c) * 7 * DAY)
    return { label: fmtDay(d), size, vals }
  })
}

export const INSIGHTS = [
  {
    title: 'Sign-ups dipped 2.1% after the Nov 19 release.',
    body: 'Most drop-off is on the Google step of /signup on Safari. 3 heatmaps and 1 funnel back this up.',
    q: 'Why did sign-ups dip after the Nov 19 release?',
  },
  {
    title: 'Pricing page visits are up 34% week over week.',
    body: 'Traffic from the launch_week campaign lands on /pricing and 1 in 5 continue to checkout.',
    q: 'What is driving the pricing page increase?',
  },
  {
    title: 'Rage clicks on “Export” tripled on mobile.',
    body: 'The export button sits under the sticky footer below 390px wide. 41 sessions hit it 4+ times.',
    q: 'Show me the rage clicks on Export',
  },
  {
    title: 'Week-1 retention climbed to 58%.',
    body: 'The Nov 10 cohort is the strongest since launch, led by users who invited a teammate on day 1.',
    q: 'Compare onboarding and feature adoption',
  },
]

export const HEAT_PAGES = ['tokencrafter.vercel.app', 'tokencrafter.vercel.app/pricing', 'tokencrafter.vercel.app/app']

/** Period-over-period change for a KPI, varied per range so switching ranges visibly moves it. */
export function rangeDelta(base: number, range: Range) {
  const k = { '24h': 0.45, '7d': 1, '30d': 0.72, '90d': 1.35 }[range]
  // other projects shift it a little, so switching project moves the pills too
  const v = base * k + (range === '24h' ? -1.3 : range === '90d' ? 0.8 : 0) + (project.seed ? ((project.seed % 7) - 3) * 0.9 : 0)
  return Math.round(v * 10) / 10
}

/**
 * How big a change is, as text (no arrow; callers add one).
 *  - Under 10 at the start: the count difference ("+9"), since 1 → 10 as
 *    "+900%" says more about the baseline than the change.
 *  - 10× and up: a multiple ("11.3×"), not "1,033%".
 *  - Otherwise a percentage, with a decimal only under 100%.
 */
export const SMALL_BASE = 10
export function fmtChange(from: number, to: number): string {
  if (from < SMALL_BASE) return `${Math.abs(to - from).toLocaleString('en-US')}`
  const p = Math.abs(((to - from) / from) * 100)
  if (to / from >= 10) return `${(to / from).toFixed(1)}×`
  return (p >= 100 ? Math.round(p).toLocaleString('en-US') : p.toFixed(1)) + '%'
}
