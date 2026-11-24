export type ChartSpec =
  | { type: 'bars'; title: string; labels: string[]; series: { key: string; label: string; color: string; values: number[] }[] }
  | { type: 'area'; title: string; labels: string[]; series: { key: string; label: string; color: string; values: number[]; dashed?: boolean }[] }
  | { type: 'funnel'; title: string; steps: { step: string; value: number }[] }

export type Answer = { steps: string[]; paras: string[]; chart?: ChartSpec }

const half = ['Mar', 'Mar 15', 'Apr', 'Apr 15', 'May', 'May 15', 'Jun', 'Jun 15', 'Jul', 'Jul 15', 'Aug', 'Aug 15', 'Sep']

const ANSWERS: { match: RegExp; a: Answer }[] = [
  {
    match: /what changed|recent/i,
    a: {
      steps: ['query events --range 14d --group week', 'compare sessions Nov 9–15 vs Nov 16–22', 'breakdown sessions by source', 'check event signup_completed volume'],
      paras: [
        'In the latest complete week (Nov 16–22) versus the prior week (Nov 9–15), website traffic increased: unique visitors rose from 11 to 20, sessions from 14 to 26, and page views from 18 to 28. Home-page views rose from 13 to 19; contact-page views rose from 1 to 6, though that baseline is too small for a reliable page-specific trend.',
        'Direct-classified sessions rose from 12 to 24, accounting for the increase in recorded sessions. That classification does not tell us what prompted the visits.',
        'I can’t establish that product feature usage, conversion, or retention changed. The checked product event had too little activity for a supported finding, and contact-page visits are not contact submissions. The most useful next checks are what drove the Direct traffic — especially the Nov 21 peak — and whether contact submissions are consistently tracked.',
      ],
      chart: {
        type: 'bars', title: 'Website traffic by month', labels: half,
        series: [
          { key: 'd', label: 'Direct', color: 'var(--s1)', values: [8, 14, 15, 21, 30, 40, 92, 120, 155, 155, 190, 230, 290] },
          { key: 'r', label: 'Referral', color: 'var(--s2)', values: [10, 18, 18, 28, 26, 22, 18, 14, 18, 16, 14, 10, 8] },
          { key: 'o', label: 'Organic search', color: 'var(--s3)', values: [4, 6, 6, 10, 12, 14, 12, 12, 14, 20, 26, 30, 34] },
        ],
      },
    },
  },
  {
    match: /sign-?ups? dip|nov 19|release/i,
    a: {
      steps: ['funnel / → /signup → signed_up --split browser', 'diff release 2026-11-19 vs prior 7d', 'heatmap /signup safari'],
      paras: [
        'Sign-ups fell 2.1% in the five days after the Nov 19 release. The loss is concentrated in one place: Safari visitors who reach /signup and choose Google.',
        'On Safari, 41% of people who click “Continue with Google” never return from the popup, against 9% on Chrome. Before the release that gap was 2 points. The new consent banner overlaps the popup trigger below 1280px wide, and the /signup heatmap shows 61 rage clicks on that button.',
        'Fixing the banner’s z-order on /signup should recover most of the gap; I’ve linked the funnel and three heatmaps to the report.',
      ],
      chart: { type: 'funnel', title: 'Sign-up funnel · Safari, since Nov 19', steps: [{ step: '/ (Landing)', value: 3120 }, { step: '/signup', value: 1410 }, { step: 'Google clicked', value: 980 }, { step: 'Signed up', value: 578 }] },
    },
  },
  {
    match: /pricing/i,
    a: {
      steps: ['pageviews /pricing --range 14d', 'breakdown by utm_campaign', 'funnel /pricing → /checkout'],
      paras: [
        'Pricing-page visits are up 34% week over week, almost all from the launch_week campaign. Those visitors convert to checkout at 19.8%, close to your organic baseline of 21%, so the campaign is bringing qualified traffic rather than just clicks.',
      ],
      chart: {
        type: 'area', title: '/pricing visitors · last 14 days', labels: ['Nov 11', 'Nov 12', 'Nov 13', 'Nov 14', 'Nov 15', 'Nov 16', 'Nov 17', 'Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24'],
        series: [
          { key: 'c', label: 'launch_week', color: 'var(--s1)', values: [40, 52, 48, 61, 90, 120, 160, 172, 168, 190, 210, 198, 230, 244] },
          { key: 'o', label: 'Organic', color: 'var(--s2)', values: [110, 118, 104, 122, 98, 90, 120, 126, 130, 124, 118, 112, 128, 132] },
        ],
      },
    },
  },
  {
    match: /rage|export/i,
    a: {
      steps: ['events rage_click --target "Export" --range 14d', 'split by device', 'replay 5 sessions with ≥4 clicks'],
      paras: [
        'Rage clicks on Export tripled, and nearly all of the increase is on mobile. Below 390px wide the sticky footer covers the bottom half of the button, so taps land on the footer instead.',
        '41 sessions hit the button four or more times in a row; 12 of them left the app within a minute.',
      ],
      chart: {
        type: 'bars', title: 'Rage clicks on Export by day', labels: ['Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24'],
        series: [
          { key: 'd', label: 'Desktop', color: 'var(--s2)', values: [6, 5, 7, 6, 4, 5, 6] },
          { key: 'm', label: 'Mobile', color: 'var(--s1)', values: [8, 11, 19, 24, 27, 31, 34] },
        ],
      },
    },
  },
  {
    match: /onboarding|adoption/i,
    a: {
      steps: ['cohort onboarding_completed by week', 'feature usage: export, share, invite', 'compare week-1 retention'],
      paras: [
        'Onboarding completion has held steady at about 64%, but feature adoption after onboarding has climbed: the share of new users who export a system in their first week rose from 22% to 37% over the last eight weeks.',
        'Users who invite a teammate on day one retain at 71% in week one, versus 49% for everyone else. That is the strongest adoption signal in the data.',
      ],
      chart: {
        type: 'area', title: 'Weekly cohorts · onboarding vs. first export', labels: ['Oct 6', 'Oct 13', 'Oct 20', 'Oct 27', 'Nov 3', 'Nov 10', 'Nov 17', 'Nov 24'],
        series: [
          { key: 'o', label: 'Completed onboarding %', color: 'var(--s1)', values: [62, 65, 63, 64, 66, 63, 65, 64] },
          { key: 'e', label: 'Exported in week 1 %', color: 'var(--s4)', values: [22, 24, 25, 28, 30, 33, 35, 37] },
        ],
      },
    },
  },
]

export function answerFor(q: string, empty = false): Answer {
  if (empty) {
    return {
      steps: ['query events --range 7d'],
      paras: ['There’s no activity in this period yet, so there’s nothing to compare. Once events start arriving I can answer this; try a longer range in the meantime.'],
    }
  }
  const hit = ANSWERS.find((a) => a.match.test(q))
  if (hit) return hit.a
  return {
    steps: ['query events --range 7d', 'compare periods --by day', 'break down by source'],
    paras: [
      'Over the last 7 days visitors rose 14% and sessions 11%. The biggest single day was Nov 21, when Direct traffic doubled.',
      'Nothing else moved outside its normal range. If you want, I can dig into what drove the Nov 21 spike.',
    ],
    chart: {
      type: 'area', title: 'Visitors · last 7 days', labels: ['Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24'],
      series: [{ key: 'v', label: 'Visitors', color: 'var(--s1)', values: [310, 342, 330, 512, 398, 288, 412] }],
    },
  }
}

export const SUGGESTION_SETS = [
  ['What changed in my product recently?', 'Compare onboarding and feature adoption', 'Show me the clearest chart from the evidence'],
  ['Why did sign-ups dip after the Nov 19 release?', 'What is driving the pricing page increase?', 'Show me the rage clicks on Export'],
]

export const RECENT = [
  { title: 'Plenty', sub: 'Found 2 causes · linked to a report', time: '2h ago', q: 'What changed in my product recently?', thumb: 'traffic' as const },
  { title: 'Export funnel drop', sub: 'Found 2 causes · linked to a report', time: '5h ago', q: 'Show me the rage clicks on Export', thumb: 'rage' as const },
  { title: 'Pricing page spike', sub: 'Found 1 cause · linked to a report', time: 'Yesterday', q: 'What is driving the pricing page increase?', thumb: 'pricing' as const },
]
