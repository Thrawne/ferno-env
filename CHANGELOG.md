# Changelog

Updated on every **major UI overhaul** (a new or redesigned page) and every **quality fix**. Newest first. Dates are when the change landed.

Entry types: **New** (screen or feature), **Changed** (redesign or behaviour change), **Fixed** (quality fix).

## 2026-11-24

### New
- **Public repo and hosting.** Prototype published as `ferno-env` and deployed to ferno-env.vercel.app.
- **Morphing tabs.** Cards with tabs now reshape the existing chart instead of rebuilding it:
  - **Traffic:** the line bends to the new metric.
  - **Pages, Sources, Region:** each row's label morphs, its bar slides and its number rolls.
  - **Technology:** the share bar's segments slide to their new widths.
  - **Event Activity:** hiding a series in the legend shrinks its segments to zero instead of removing them.
- **Recent thread thumbnails** on Ferno Agent: stacked report cards over the amber pixel grid, each showing that chat's chart. Hovering one fans the back card out.
- **Fonts and libraries:** added the Allo font (`--font-allo`), glimm and torph.

### Changed
- **Recent thread thumbnails:** fewer, chunkier bars (4 on the front card, 3 on the back, down from 7 and 6) so they read at thumbnail size, closer to the Figma.
- **Demo user:** the user card and the agent greeting now use a generic demo user (Alex Morgan).
- **Analytics KPI tiles:** removed the sparklines.

### Fixed
- **Recent thumbnails:** they now fill their card's full height.
- **Traffic chart:** no longer drifts, which had caused a flattening line and repeated date labels.
- **Dev setup:** clearing Vite's dependency cache after installing packages fixes the duplicate-React "Invalid hook call".

## 2026-11-24 — Round 2: feedback pass

### New
- **Responsive layout** from wide desktop down to 360px phones. At 1024px and below the sidebar becomes a drawer with a top bar.
- **Liveline line charts** for Active Users, Traffic and the chat charts.

### Changed
- **Logos and icons:**
  - Real brand logos for sources, browsers and operating systems.
  - Sidebar workspace, agent and avatar icons are exported from Figma instead of redrawn.
- **Mono font** for page paths, campaign names, axis labels and KPI date ranges.
- **Bar charts:** a dashed line at the latest total with a value badge.
- **Sparklines:** smoothed, and moved into their own strip so they never overlap text.

### Fixed
- **KPI tiles:** the empty state's numbers were centred by mistake.
- **Mobile:** navigating now closes the drawer, and the heatmap controls wrap.

## 2026-11-24 — Round 1: first build

### New
- **First build:**
  - Sign in, Overview, Ferno Agent, Chat, Heatmaps and Analytics from the Figma v2 section.
  - A placeholder for every other sidebar item.
  - The prototype Data switch (Filled / Loading / Empty) and the date-range menu.
