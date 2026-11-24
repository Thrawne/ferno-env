// Mock reports, modelled on what Ferno's investigator actually stores:
// an automatic (or chat-asked) lead with a baseline vs current window and a
// z-score, a run status, a verdict, an impact score, findings, uncertainties,
// and an evidence trail of the queries it ran. Findings need >= 10 unique users.

import { useSyncExternalStore } from 'react'

export type Status = 'completed' | 'running' | 'failed'
export type Verdict = 'findings' | 'insufficient' | 'no-change'
export type Impact = 'high' | 'medium' | 'low' | null

export type Report = {
  id: string
  title: string
  summary: string
  source: 'automatic' | 'chat'
  event: string
  page: string
  from: number
  to: number
  unit: string
  z: number
  window: string
  users: { base: number; current: number }
  status: Status
  verdict: Verdict
  impact: Impact
  created: string
  dataThrough: string
  findings: string[]
  recommendations: string[]
  uncertainties: string
  evidence: { tool: string; at: string; query: string; result: string }[]
  chart?: { labels: string[]; base: number[]; current: number[] }
  error?: string
  question?: string
}

export const MIN_USERS = 10

const hours = Array.from({ length: 12 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`)

const INITIAL: Report[] = [
  {
    id: 'pricing-dead-clicks',
    title: 'Dead clicks on the pricing toggle jumped tenfold',
    summary: 'Visitors are clicking the Monthly / Yearly label instead of the switch. The label looks interactive but does nothing, and 3 in 10 people who hit it leave /pricing within a minute.',
    source: 'automatic', event: 'dead_click', page: '/pricing', from: 6, to: 68, unit: 'per day', z: 25.3,
    window: 'Nov 23 – Nov 24', users: { base: 9, current: 41 },
    status: 'completed', verdict: 'findings', impact: 'high', created: 'Nov 24, 4:29 AM', dataThrough: 'Nov 24, 2026, 4:29 AM',
    findings: [
      '62 of 68 dead clicks land on the “Billed yearly” label, not the switch beside it.',
      'Sessions with a dead click on /pricing exit 29% of the time, against 11% for the rest.',
      'The jump starts with the Nov 22 deploy that restyled the toggle as plain text.',
    ],
    recommendations: ['Make the whole “Monthly / Yearly” label toggle the switch.', 'Re-check the /pricing heatmap a week after the fix.'],
    uncertainties: '41 unique users in the current window is above the 10-user minimum, but the baseline (9 users) is just under it, so the size of the jump is approximate.',
    evidence: [
      { tool: 'get available events', at: 'Nov 24, 4:29 AM', query: 'events(project="tokencraft", since="2026-11-22")', result: '12 event types · dead_click, heatmap, rage_click, exception …' },
      { tool: 'compare periods', at: 'Nov 24, 4:29 AM', query: 'compare("dead_click", base=[11-22, 11-23), current=[11-23, 11-24))', result: 'base 6 (9 users) → current 68 (41 users) · +1033.3% · z = 25.31' },
      { tool: 'break down by target', at: 'Nov 24, 4:30 AM', query: 'breakdown("dead_click", by="element", page="/pricing")', result: 'label.billing-toggle 62 · h1 4 · footer link 2' },
      { tool: 'exit rate after event', at: 'Nov 24, 4:30 AM', query: 'exit_rate(after="dead_click", page="/pricing")', result: '29.3% vs 11.0% baseline' },
    ],
    chart: { labels: hours, base: [0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0], current: [2, 1, 4, 6, 9, 8, 7, 6, 8, 7, 5, 5] },
  },
  {
    id: 'signup-dip',
    title: 'Sign-ups dipped 2.1% after the Nov 19 release',
    summary: 'The drop is concentrated on Safari, at the Google step of /signup. A consent banner added in the release overlaps the popup trigger below 1280px wide.',
    source: 'chat', question: 'Why did sign-ups dip after the Nov 19 release?', event: 'signup_completed', page: '/signup', from: 1420, to: 1390, unit: 'per week', z: -3.4,
    window: 'Nov 19 – Nov 24', users: { base: 412, current: 398 },
    status: 'completed', verdict: 'findings', impact: 'high', created: 'Nov 23, 6:12 PM', dataThrough: 'Nov 23, 2026, 6:10 PM',
    findings: ['41% of Safari users who click “Continue with Google” never return from the popup, against 9% on Chrome.', 'Before the release that gap was 2 points.', '61 rage clicks on the Google button since Nov 19, all below 1280px.'],
    recommendations: ['Raise the popup trigger above the consent banner on /signup.', 'Add a Safari-only check to the release checklist.'],
    uncertainties: 'Safari is 25% of sign-up traffic, so the overall dip (2.1%) is small; the Safari-only effect is clear.',
    evidence: [
      { tool: 'funnel', at: 'Nov 23, 6:11 PM', query: 'funnel(["/", "/signup", "google_clicked", "signed_up"], split="browser")', result: 'Safari: 3,120 → 1,410 → 980 → 578 · Chrome: … → 0.91 completion' },
      { tool: 'compare periods', at: 'Nov 23, 6:11 PM', query: 'compare("signup_completed", around="release 2026-11-19")', result: '1,420 → 1,390 per week · −2.1% · z = −3.4' },
      { tool: 'heatmap', at: 'Nov 23, 6:12 PM', query: 'heatmap("/signup", browser="Safari", kind="rage")', result: '61 rage clicks on button.google' },
    ],
    chart: { labels: ['Nov 13', 'Nov 14', 'Nov 15', 'Nov 16', 'Nov 17', 'Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24'], base: [60, 62, 59, 63, 61, 60, 61, 61, 62, 60, 61, 61], current: [60, 62, 59, 63, 61, 60, 58, 56, 57, 55, 57, 57] },
  },
  {
    id: 'export-rage',
    title: 'Rage clicks on Export climbing on mobile',
    summary: 'Ferno is checking whether the sticky footer covers the Export button on narrow screens.',
    source: 'automatic', event: 'rage_click', page: '/app', from: 6, to: 34, unit: 'per day', z: 8.7,
    window: 'Nov 18 – Nov 24', users: { base: 5, current: 41 },
    status: 'running', verdict: 'findings', impact: null, created: 'Nov 24, 9:02 AM', dataThrough: 'Nov 24, 2026, 9:00 AM',
    findings: [], recommendations: [], uncertainties: '',
    evidence: [
      { tool: 'get available events', at: 'Nov 24, 9:02 AM', query: 'events(project="tokencraft", since="2026-11-18")', result: '12 event types' },
      { tool: 'compare periods', at: 'Nov 24, 9:02 AM', query: 'compare("rage_click", target="button.export")', result: '6 → 34 per day · +466.7% · z = 8.7' },
    ],
  },
  {
    id: 'pricing-visits',
    title: 'Pricing page visits up 34% from launch_week',
    summary: 'Almost all of the increase comes from the launch_week campaign. Those visitors reach checkout at 19.8%, close to the 21% organic baseline, so it is qualified traffic.',
    source: 'chat', question: 'What is driving the pricing page increase?', event: 'page_view', page: '/pricing', from: 132, to: 177, unit: 'visitors per day', z: 4.1,
    window: 'Nov 17 – Nov 24', users: { base: 924, current: 1239 },
    status: 'completed', verdict: 'findings', impact: 'medium', created: 'Nov 22, 11:40 AM', dataThrough: 'Nov 22, 2026, 11:38 AM',
    findings: ['launch_week accounts for 88% of the added visitors.', 'Checkout rate from those visitors: 19.8% (organic 21%).'],
    recommendations: ['Keep launch_week running through December.'],
    uncertainties: 'Campaign attribution relies on UTM tags; untagged shares of the campaign show up as Direct.',
    evidence: [
      { tool: 'compare periods', at: 'Nov 22, 11:39 AM', query: 'compare("page_view", page="/pricing", weeks=2)', result: '132 → 177 per day · +34.1% · z = 4.1' },
      { tool: 'break down by source', at: 'Nov 22, 11:39 AM', query: 'breakdown("page_view", by="utm_campaign", page="/pricing")', result: 'launch_week +40 · organic +3 · direct +2' },
    ],
    chart: { labels: ['Nov 11', 'Nov 12', 'Nov 13', 'Nov 14', 'Nov 15', 'Nov 16', 'Nov 17', 'Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22'], base: [130, 128, 134, 131, 129, 133, 132, 131, 134, 130, 133, 132], current: [130, 128, 134, 131, 129, 133, 150, 162, 170, 168, 175, 177] },
  },
  {
    id: 'heatmap-too-little',
    title: 'Heatmap increase has too little data',
    summary: 'heatmap events rose from 3 to 9 a day, but from only 2 visitors. Not enough to say anything changed.',
    source: 'automatic', event: 'heatmap', page: '/', from: 3, to: 9, unit: 'per day', z: 2.9,
    window: 'Nov 8 – Nov 9', users: { base: 1, current: 2 },
    status: 'completed', verdict: 'insufficient', impact: null, created: 'Nov 9, 5:55 PM', dataThrough: 'Nov 9, 2026, 5:55 PM',
    findings: [], recommendations: [],
    uncertainties: 'Neither window reaches the minimum of 10 unique users needed to support a finding (baseline 1, current 2). The counts cannot establish whether a broader visitor change occurred.',
    evidence: [
      { tool: 'get available events', at: 'Nov 9, 5:55 PM', query: 'events(project="tokencraft", since="2026-11-07")', result: '9 event types' },
      { tool: 'compare periods', at: 'Nov 9, 5:55 PM', query: 'compare("heatmap", base=[11-07, 11-08), current=[11-08, 11-09))', result: 'base 3 (1 user) → current 9 (2 users) · +200%' },
    ],
  },
  {
    id: 'rage-failed',
    title: 'rage_click rose from 1 to 10 a day',
    summary: 'Ferno picked this up automatically but the investigation couldn’t finish.',
    source: 'automatic', event: 'rage_click', page: '/', from: 1, to: 10, unit: 'per day', z: 9.0,
    window: 'Oct 30 – Oct 31', users: { base: 1, current: 4 },
    status: 'failed', verdict: 'findings', impact: null, created: 'Oct 31, 9:08 AM', dataThrough: 'Oct 31, 2026, 9:08 AM',
    findings: [], recommendations: [], uncertainties: '',
    error: 'The analysis service was unavailable, so the investigation stopped before running any queries. Nothing was lost; run it again when you’re ready.',
    evidence: [],
  },
]

/* A tiny store so a retry on the detail page shows up in the list too. */
let reports = INITIAL
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
export function useReports() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => reports)
}
export function updateReport(id: string, patch: Partial<Report>) {
  reports = reports.map((r) => (r.id === id ? { ...r, ...patch } : r))
  emit()
}

/** Re-run a failed report: running for a few seconds, then findings. */
export function retry(id: string) {
  updateReport(id, { status: 'running', error: undefined, evidence: [] })
  const steps = [
    { tool: 'get available events', at: 'just now', query: 'events(project="tokencraft", since="2026-10-29")', result: '9 event types' },
    { tool: 'compare periods', at: 'just now', query: 'compare("rage_click", base=[10-29, 10-30), current=[10-30, 10-31))', result: 'base 1 (1 user) → current 10 (4 users) · +900% · z = 9.0' },
  ]
  steps.forEach((s, i) => setTimeout(() => {
    const r = reports.find((x) => x.id === id)!
    updateReport(id, { evidence: [...r.evidence, s] })
  }, 900 * (i + 1)))
  setTimeout(() => updateReport(id, {
    status: 'completed', verdict: 'insufficient', title: 'rage_click spike spans too few visitors',
    summary: 'rage_click rose from 1 to 10 a day, but from only 4 visitors, under the 10-user minimum.',
    uncertainties: 'The current window has 4 unique users (baseline 1); a finding needs at least 10. The spike may be one person repeatedly clicking.',
    created: 'Just now', dataThrough: 'Oct 31, 2026, 9:08 AM',
  }), 900 * (steps.length + 1) + 400)
}

export const pct = (r: Report) => ((r.to - r.from) / Math.max(r.from, 1e-9)) * 100
