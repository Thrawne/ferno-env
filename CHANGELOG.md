# Changelog

Updated on every **major UI overhaul** (a new or redesigned page) and every **quality fix**. Newest first. Dates are when the change landed.

Entry types: **New** (screen or feature), **Changed** (redesign or behaviour change), **Fixed** (quality fix).

## 2026-11-24 — Design audit pass

### Fixed
- **Bounce rate showed red when it fell;** KPIs now take `lowerIsBetter`.
- **Report charts:** they showed a single time label, because hourly data sat on a daily scale. `LiveChart` now takes a `step`. They also get a baseline-average reference line, so the zoomed axis can't exaggerate a change.
- **Funnel editor:** disabled controls (Save Funnel, heatmap layers) now look disabled, and the editor has Cancel.
- **Invalid markup:** buttons wrapped block elements. Report rows and Recent cards are now links, and the sidebar buttons use inline markup.
- **Contrast** (WCAG AA):
  - Light grey text darkened to #737373 (4.7:1, was 3.5:1), and sidebar section labels to #6E6E6E.
  - Darker blue on the "Investigating" chip (5.9:1).
  - Lighter background behind the green "up" pill (4.6:1).
  - Solid white text on the Ferno Noticed card.
  - The filter count badge moved to accent-600.
  - Empty meter squares are now visible.
- **Empty mode:**
  - The Noticed card says "Nothing to flag yet".
  - Agent's Recent section shows an empty line.
  - Report pages show "No reports yet".
  - Chat answers that there's no activity yet.
- **Chat:** going back to the chat no longer replays answers you've already seen.
- **Conversion:** now varies with the date range and agrees with the funnel.
- **Heatmap totals:** they follow the selected page and range, and morph when they change.
- **Number formatting:** "1,420 → 1,390", and big changes drop the decimal ("↑1,033%").

### Changed
- **Copy:**
  - Removed the "Hover to scrub · tap a chip" hint.
  - The chat fallback no longer talks about the prototype, and "Tested the product 3 times, ran 4 commands" is now "Ran 4 queries".
  - Running reports drop the duplicate "In progress" pill.
  - The sample-size note is one line.
  - Placeholder pages say "Coming soon", and spelling is US English throughout.
- **Visual consistency:**
  - The collapsed sidebar has one divider between groups.
  - Legends use the same chips as Liveline.
  - The bar chart's latest-total tag now says what it is ("Nov 24 · 2,380").
  - Recent cards use a neutral hover, and the Data switcher uses the shared popover shadow.
- **Ferno Noticed card:**
  - The headline and body fade in together (0.25s) instead of morphing letter by letter.
  - The progress bar runs on CSS.
  - It pauses on hover and keyboard focus, and doesn't auto-rotate under reduced motion.
  - When stacked, it sizes to its content.
- **Motion:**
  - Pages fade in over 0.15s instead of fading and sliding over 0.35s.
  - Chart reveals are shorter.
  - Sparklines no longer pulse.

### Not changed
- **Idle Liveline charts:** I looked into pausing them, but Liveline redraws every frame no matter what (it only stops when the tab is hidden), so a prop can't idle it.
- **Sidebar toggle colour:** it stays grey 300, as chosen (1.8:1).

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
- **Favicon:** now the workspace logo from the sidebar (exported from Figma).
- **Reports layout now matches Overview:**
  - Report rows are separate rounded cards on the grey fill, spanning the full width of the page header.
  - The detail page is one grouped block: the main column and the side panel share the same grey fill. The side panel stretches so both columns end on the same line. The evidence-trail steps are grouped on the grey fill too, instead of separate outlined boxes.
  - The report count sits beside the "Reports" title, morphing with torph, instead of in a separate "REPORTS · 6" row. `PageHeader` takes an optional `count` for this. It uses the same font and size as the title, in grey 600.
  - **Report rows follow Figma 227:34690:**
    - The source is a plain icon and label, not a pill.
    - Change is a two-cell box (change | rate) with a full-height divider.
    - Impact is a 5-square pixel meter. Filled squares step up the accent ramp, ending at accent-500 at the fill edge (high: accent-200 → 500); high fills 4, medium 3, low 2. It sits on the right under the chevron, and drops below the footer on phones.
    - The date moved into the right-hand column, right-aligned with the chevron and level with the top row.

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
- **Pixel meter squares all rendered the same amber:** the fade-in animation ended at full opacity and overrode each square's own transparency. Each square now has its own colour.
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
