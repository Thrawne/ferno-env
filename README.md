# Ferno env

An interactive prototype of the **Ferno** redesign: the screens from the Figma redesign, built as a clickable front end so the team can see the direction, try the interactions and lift code into the real product.

**Live:** https://ferno-env.vercel.app

> This is a mask of the product, not the product. Nothing talks to a backend: data is mock, the agent's answers are scripted, and sign-in goes straight to the app.

## What's in it

| Screen | Route | Highlights |
|---|---|---|
| Sign in | `#/signin` | Split layout, pixel field, floating insight cards |
| Overview | `#/overview` | KPI tiles with sparklines, Active Users (Liveline), Event Activity stacked bars, flowing conversion funnel with a working funnel builder, rotating "Ferno noticed" insights |
| Ferno Agent | `#/agent` | Composer with menus, suggestion sets, Recent threads with animated thumbnails |
| Chat | `#/chat` | Thinking state, expandable steps, streamed answer, a chart per answer |
| Heatmaps | `#/heatmaps` | Page picker, heat layer, rage/dead-click markers, movement paths, desktop/mobile |
| Analytics | `#/analytics` | Traffic vs previous period (Liveline), pages, sources, technology, region, weekly retention |
| Reports | `#/reports`, `#/report/:id` | Investigation list with sort and status filter; report detail with findings, baseline-vs-current chart, next steps, uncertainties, expandable evidence trail, investigated lead and sample-size check; failed reports can be re-run |

Members, API Keys, Integrations, Docs and Settings show a placeholder for now.

**Prototype controls:** the floating **Data** switch (bottom right) flips every screen between *Filled*, *Loading* (the pixel squares fill in) and *Empty* (the Figma empty states). The date-range menu changes the data too. The sidebar's **Prototype** group opens **All tips** (every tip card on one page), replays the guided tour, and switches the small tooltips between the current style and the Figma tip style.

**Tips:** the guided tour (first visit, or *Take the tour*) and the (i) beside card titles both use the Figma tip card (`src/components/Tip.tsx`). Its faux-UI art lives in `src/components/TipArt.tsx`.

## Design source

- Figma: *TokenCraft › useFerno* page (v2 section `225:34462`), UseFerno variables and text styles.
- Tokens live in `src/styles.css` (`:root`): amber accent `#d97706`, neutrals, radii, shadows.
- Type: Manrope (headings), Inter (body), SF Mono / Geist Mono (numbers, paths, axis labels). Allo is bundled (`--font-allo`) but not used yet.
- Chart palette (validated for colour-blind separation, in this order): amber `#d97706`, blue `#2a78d6`, aqua `#1baf7a`, violet `#6250d6`, magenta `#e87ba4`, green `#008300`.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` type-checks and builds to `dist/`.

## How it's built

- **Vite + React + TypeScript**, plain CSS, hash routes (no router).
- **Charts**
  - Line charts use [Liveline](https://benji.org/liveline) via `src/charts/LiveChart.tsx`. Liveline plots against the wall clock, so points are spaced one day apart and values are tweened on tab switches so the line morphs instead of redrawing.
  - Bars, funnel, donut, retention grid and sparklines are hand-built SVG (`src/charts/`) in the same visual language.
  - Ranked lists and the share bar keep fixed row slots so switching tabs morphs labels ([torph](https://torph.dev)), bar widths and numbers in place.
- **Recent thumbnails** are small faux UIs built with the [stageshow](./src/kit) kit (`src/components/RecentThumb.tsx`).
- **Assets:** sidebar icons are exported from Figma (`public/brand/`); brand logos are SVGs from svgl (`public/logos/`).
- **glimm** ([glimm.dev](https://glimm.dev)) plays the accent sweep in the tour's empty → filled illustration (`GlimmScope`, band only).

### Where things live

```
src/
  App.tsx              routes, shell, prototype Data switch
  data.ts              all mock data (seeded, per date range)
  styles.css           tokens + every style, responsive breakpoints at the end
  components/          Sidebar, shared UI (Select, Seg, KPI, empty/loading), RecentThumb
  charts/              LiveChart, StackedBars, ShareBar, Funnel, Donut, RetentionGrid, BarList
  pages/               one file per screen; answers.ts holds the scripted agent replies
  kit/                 stageshow kit (vendored)
public/brand, logos, fonts
```

## Taking code into Ferno

Most pieces are self-contained and safe to copy:

- `src/charts/*`: each chart takes plain arrays; swap the mock data for real queries.
- `src/components/ui.tsx`: `Select`, `Seg` (sliding segmented control), `Kpi`, `PixelCorner`, `PixelLoader`, `EmptyState`.
- Styles assume the tokens at the top of `src/styles.css`.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). It's updated on every major UI overhaul (a new or redesigned page) and every quality fix.
