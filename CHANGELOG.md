# Changelog

Updated on every **major UI overhaul** (a new or redesigned page) and every **quality fix**. Newest first. Dates are when the change landed.

Entry types: **New** (screen or feature), **Changed** (redesign or behaviour change), **Fixed** (quality fix).

## 2026-11-24 — Reports, number morphing

### New
- **Reports page** (`#/reports`), modelled on the investigations Ferno actually stores:
  - **List:** the source (automatic or asked in chat) and the event and page it concerns; title and summary; the change (coloured by whether rising is good or bad for that metric) and the before-and-after rate; the verdict, an impact meter and the run status. Sort and status filter use the shared Popover.
  - **Detail** (`#/report/:id`): verdict, status, score and "data through"; findings, a baseline-vs-current Liveline chart, next steps and uncertainties; an expandable evidence trail of each query and its result. A side panel shows the investigated lead (change, rate, z-score, page, source, window) and checks sample size against the 10-unique-user minimum.
  - **Failed reports** show a plain-language error with **Run again**, instead of the raw provider error. Re-running streams in the evidence steps, then completes.
  - **Empty and loading states,** "View all" on Ferno Agent now opens Reports, and the layout works down to phone width.
- **Number morphing (torph):**
  - **KPI tiles:** numbers and their change percentages now roll digit by digit when the date range changes, instead of reloading. Only the charts show the pixel loader, and the change percentages now vary by range.
  - **Elsewhere:** the Ferno Noticed headline morphs into the next insight. Text also morphs for the funnel "converted" summary, the chat's "Thinking…" → "Thought for 6s", the composer chips, plain-text select values, the report sort label and the report count.

### Changed
- **Favicon:** now the Ferno Agent icon exported from Figma.
- **Reports layout now matches Overview:**
  - Report rows are separate rounded cards on the grey fill, spanning the full width of the page header.
  - The detail page groups its sections the same way: one group for the main column and one for the side panel.
  - The report count sits beside the "Reports" title, morphing with torph, instead of in a separate "REPORTS · 6" row. `PageHeader` takes an optional `count` for this.

## 2026-11-24

### New
- **Collapsible sidebar (desktop), modelled on CostGraph's header:**
  - The sidebar collapses to a 64px icon rail with tooltips.
  - The toggle is MingCute's `sidebar-left-line` (20px icon, 32px button): grey 300 at rest, grey 500 on hover, no fill.
  - It sits before each page's title (and before "Ferno agent" on Agent and Chat) in a hidden slot. Hovering the title row, or tabbing to it, grows the slot to 40px and fades it in (200ms, ease-out). It waits 150ms before hiding, so a pass-by doesn't flicker, and stays hidden while the sidebar is collapsed.
  - ⌘B / Ctrl+B toggles from anywhere, and the choice is remembered.
  - Icons don't move during the collapse: every icon stays centred at x=32 in both states.
  - Phones keep the drawer.
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
- **Dropdowns no longer get cut off inside cards.** Every menu (selects, composer chips, workspace and account menus) now renders in a layer above the page through one `Popover` (`src/components/ui.tsx`). It:
  - opens below its trigger, or flips above when there isn't room below;
  - caps its height to the space available and scrolls inside;
  - stays inside the window horizontally;
  - follows its trigger while the page scrolls or resizes, and closes once the trigger scrolls off screen.
  It scales in from the side it opens from (150ms) and exits faster (100ms).
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
