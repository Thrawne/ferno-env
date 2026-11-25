import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { ProjectTile, Sidebar } from './components/Sidebar'
import { AppCtx, EmptyState, PageHeader, PixelCorner, Seg, type Mode, type Theme, type TipStyle } from './components/ui'
import { TipGallery, Tour } from './components/Tip'
import { Toaster } from './components/overlay'
import { CommandPalette } from './components/Command'
import { Notifications } from './components/Notifications'
import { PROJECTS, setDataProject, type Project, type Range } from './data'
import { ask as askIn, newThread } from './chats'
import { Integrations } from './pages/Integrations'
import { ApiKeys } from './pages/ApiKeys'
import { Members } from './pages/Members'
import { Settings } from './pages/Settings'
import { Setup } from './pages/Setup'
import { EventDetail, Events } from './pages/Events'
import { Overview } from './pages/Overview'
import { Analytics } from './pages/Analytics'
import { Heatmaps } from './pages/Heatmaps'
import { AgentHome, Chat, ChatHistory } from './pages/Agent'
import { SignIn } from './pages/SignIn'
import { Landing } from './pages/Landing'
import { ReportDetail, Reports } from './pages/Reports'

const TITLES: Record<string, [string, string]> = {
  docs: ['Docs', 'Guides for instrumenting your product.'],
}

const readRoute = () => location.hash.replace(/^#\/?/, '') || 'overview'

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [range, setRangeState] = useState<Range>('7d')
  const [mode, setModeState] = useState<Mode>('filled')
  const [loading, setLoading] = useState(false)
  // a date-range change refreshes the charts only; KPI numbers morph in place
  const [refreshing, setRefreshing] = useState(false)
  const refreshTimer = useRef<number>(0)
  // projects: switching one changes every number (charts reload and morph); an empty one has no events yet
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [projectId, setProjectId] = useState(() => { try { return localStorage.getItem('ferno:project') ?? 'tokencraft' } catch { return 'tokencraft' } })
  const project = projects.find((p) => p.id === projectId) ?? projects[0]
  setDataProject(project) // the data functions read it during this render

  // theme: per device
  const [theme, setThemeState] = useState<Theme>(() => { try { return localStorage.getItem('ferno:theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } })
  const setTheme = useCallback((t: Theme) => { setThemeState(t); try { localStorage.setItem('ferno:theme', t) } catch { /* */ } }, [])
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme }, [theme])

  // ⌘K / Ctrl+K: the command palette
  const [palette, setPalette] = useState(false)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((o) => !o) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsedState] = useState(() => { try { return localStorage.getItem('ferno:sidebar') === 'collapsed' } catch { return false } })
  const setCollapsed = useCallback((c: boolean) => {
    setCollapsedState(c)
    try { localStorage.setItem('ferno:sidebar', c ? 'collapsed' : 'open') } catch { /* private mode */ }
  }, [])
  // ⌘\ / Ctrl+\ toggles the sidebar from anywhere
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') { e.preventDefault(); setCollapsedState((c) => { const n = !c; try { localStorage.setItem('ferno:sidebar', n ? 'collapsed' : 'open') } catch { /* */ } return n }) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const timer = useRef<number>(0)

  // prototype: which style the small tooltips use (compare against the Figma tip card)
  const [tipStyle, setTipStyleState] = useState<TipStyle>(() => { try { return localStorage.getItem('ferno:tips') === 'figma' ? 'figma' : 'classic' } catch { return 'classic' } })
  const setTipStyle = useCallback((t: TipStyle) => { setTipStyleState(t); try { localStorage.setItem('ferno:tips', t) } catch { /* */ } }, [])
  useEffect(() => { document.documentElement.dataset.tips = tipStyle }, [tipStyle])

  // guided tour: opens once on a first visit, and from the sidebar any time
  const [tour, setTour] = useState(0) // 0 = closed, otherwise a run number (restarts at step 1)
  const startTour = useCallback(() => { setNavOpen(false); setTour((t) => t + 1) }, [])
  const endTour = useCallback(() => { setTour(0); try { localStorage.setItem('ferno:tour', 'done') } catch { /* */ } }, [])
  useEffect(() => {
    let seen = true
    try { seen = localStorage.getItem('ferno:tour') === 'done' } catch { /* */ }
    if (seen || readRoute() === 'signin' || readRoute() === 'landing') return
    const t = setTimeout(() => setTour(1), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const h = () => { setRoute(readRoute()); setNavOpen(false) }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  const go = useCallback((r: string) => {
    location.hash = '/' + r
    document.querySelector('.main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [])

  /** Brief load (pixel squares filling in) whenever the data changes. */
  const flash = useCallback((ms = 900) => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLoading(false), ms)
  }, [])

  const setRange = (r: Range) => {
    setRangeState(r)
    refresh()
  }
  const setMode = (m: Mode) => {
    if (m === 'loading') { setModeState('filled'); flash(2400); return }
    setModeState(m); setLoading(false)
  }

  /** A question goes to the open chat, or starts a new one. */
  const ask = (q: string) => {
    if (route.startsWith('chat/')) askIn(route.slice(5), q)
    else go('chat/' + newThread(q))
  }

  const refresh = () => {
    setRefreshing(true)
    clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => setRefreshing(false), 700)
  }
  const setProject = useCallback((id: string) => {
    setProjectId(id)
    try { localStorage.setItem('ferno:project', id) } catch { /* */ }
    refresh()
  }, []) // eslint-disable-line
  const updateProject = useCallback((p: Project) => { setProjects((ps) => ps.map((x) => (x.id === p.id ? p : x))); refresh() }, []) // eslint-disable-line
  const newProject = useCallback(() => {
    const p: Project = { id: 'p-' + Date.now().toString(36), name: 'Untitled', domain: '', k: 0, seed: 0, empty: true }
    setProjects((ps) => [...ps, p])
    setProjectId(p.id)
    go('setup')
  }, [go])

  // an empty project has nothing to show, whatever the Data switch says
  const effMode: Mode = project.empty ? 'empty' : mode
  const ctx = {
    route, go, range, setRange, mode: effMode, setMode, loading, refreshing, collapsed, setCollapsed, tipStyle, setTipStyle, startTour,
    projects, project, setProject, updateProject, theme, setTheme, openPalette: () => setPalette(true), newProject,
  }

  if (route === 'signin') {
    return <AppCtx.Provider value={ctx}><SignIn /></AppCtx.Provider>
  }
  if (route === 'landing') {
    return <AppCtx.Provider value={ctx}><Landing /><Toaster /></AppCtx.Provider>
  }

  let page
  if (route === 'overview') page = <Overview ask={ask} />
  else if (route === 'analytics') page = <Analytics />
  else if (route === 'heatmaps') page = <Heatmaps />
  else if (route === 'reports') page = <Reports />
  else if (route.startsWith('report/')) page = <ReportDetail id={route.slice(7)} />
  else if (route === 'agent' || route === 'chat') page = <AgentHome onAsk={ask} />
  else if (route.startsWith('chat/')) page = <Chat id={route.slice(5)} onAsk={ask} />
  else if (route === 'chats') page = <ChatHistory />
  else if (route === 'events') page = <Events />
  else if (route.startsWith('event/')) page = <EventDetail name={decodeURIComponent(route.slice(6))} />
  else if (route === 'integrations') page = <Integrations />
  else if (route === 'api-keys') page = <ApiKeys />
  else if (route === 'members') page = <Members />
  else if (route === 'settings') page = <Settings key={project.id} />
  else if (route === 'setup') page = <Setup key={project.id} />
  else if (route === 'tips') page = <div className="page fade-page"><PageHeader title="Tips" sub="Every tour step and info tip in one place." /><TipGallery /></div>
  else {
    const [t, s] = TITLES[route] ?? ['Not found', '']
    page = (
      <div className="page fade-page" key={route}>
        <PageHeader title={t} sub={s} />
        <div className="group"><div className="card" style={{ minHeight: 420 }}>
          <EmptyState title="Coming soon" sub="This page is on its way." />
          <PixelCorner cols={22} rows={8} size={14} opacity={0.4} />
        </div></div>
      </div>
    )
  }

  return (
    <AppCtx.Provider value={ctx}>
      <div className={'shell' + (navOpen ? ' nav-open' : '') + (collapsed ? ' collapsed' : '')}>
        <header className="topbar">
          <button className="btn icon-btn btn-ghost" aria-label="Open menu" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
          <ProjectTile id={project.id} size={24} />
          <span style={{ fontWeight: 500 }}>Ennead</span>
          <span style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{project.name}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            <button className="btn icon-btn btn-ghost" aria-label="Search" onClick={() => setPalette(true)}><Search size={17} /></button>
            <Notifications compact />
          </span>
        </header>
        <Sidebar onNavigate={() => setNavOpen(false)} />
        <div className="scrim" onClick={() => setNavOpen(false)} />
        <main className="main" key={route}>{page}</main>
      </div>
      <div className="proto-dock" role="group" aria-label="Prototype data state" data-tour="dock">
        <span style={{ opacity: .7 }}>Data</span>
        <Seg<string> value={loading && mode === 'filled' ? 'Loading' : mode === 'empty' ? 'Empty' : 'Filled'}
          options={['Filled', 'Loading', 'Empty']}
          onChange={(v) => setMode(v.toLowerCase() as Mode)} />
      </div>
      {tour > 0 && route !== 'signin' && <Tour key={tour} onClose={endTour} />}
      <CommandPalette open={palette} onClose={() => setPalette(false)} onAsk={(q) => go('chat/' + newThread(q))} onNewProject={newProject} />
      <Toaster />
    </AppCtx.Provider>
  )
}
