import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar, WsTile } from './components/Sidebar'
import { AppCtx, EmptyState, PageHeader, PixelCorner, Seg, type Mode } from './components/ui'
import type { Range } from './data'
import { Overview } from './pages/Overview'
import { Analytics } from './pages/Analytics'
import { Heatmaps } from './pages/Heatmaps'
import { AgentHome, Chat, type Msg } from './pages/Agent'
import { SignIn } from './pages/SignIn'

const TITLES: Record<string, [string, string]> = {
  reports: ['Reports', 'Saved investigations and the evidence behind them.'],
  members: ['Members', 'Who can see this workspace and what they can change.'],
  'api-keys': ['API Keys', 'Keys your apps use to send events to Ferno.'],
  integrations: ['Integrations', 'Connect the tools and sources Ferno reads from.'],
  docs: ['Docs', 'Guides for instrumenting your product.'],
  settings: ['Settings', 'Workspace and account preferences.'],
}

const readRoute = () => location.hash.replace(/^#\/?/, '') || 'overview'
const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [range, setRangeState] = useState<Range>('7d')
  const [mode, setModeState] = useState<Mode>('filled')
  const [loading, setLoading] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsedState] = useState(() => { try { return localStorage.getItem('ferno:sidebar') === 'collapsed' } catch { return false } })
  const setCollapsed = useCallback((c: boolean) => {
    setCollapsedState(c)
    try { localStorage.setItem('ferno:sidebar', c ? 'collapsed' : 'open') } catch { /* private mode */ }
  }, [])
  // ⌘\ / Ctrl+\ toggles the sidebar from anywhere
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); setCollapsedState((c) => { const n = !c; try { localStorage.setItem('ferno:sidebar', n ? 'collapsed' : 'open') } catch { /* */ } return n }) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const timer = useRef<number>(0)

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

  const setRange = (r: Range) => { setRangeState(r); flash(700) }
  const setMode = (m: Mode) => {
    if (m === 'loading') { setModeState('filled'); flash(2400); return }
    setModeState(m); setLoading(false)
  }

  const ask = (q: string) => {
    setMsgs((m) => [...m, { id: Date.now(), q, time: now() }])
    go('chat')
  }

  if (route === 'signin') {
    return <AppCtx.Provider value={{ route, go, range, setRange, mode, setMode, loading, collapsed, setCollapsed }}><SignIn /></AppCtx.Provider>
  }

  let page
  if (route === 'overview') page = <Overview ask={ask} />
  else if (route === 'analytics') page = <Analytics />
  else if (route === 'heatmaps') page = <Heatmaps />
  else if (route === 'agent') page = <AgentHome onAsk={ask} />
  else if (route === 'chat') page = msgs.length ? <Chat msgs={msgs} onAsk={ask} /> : <AgentHome onAsk={ask} />
  else {
    const [t, s] = TITLES[route] ?? ['Not found', '']
    page = (
      <div className="page fade-page" key={route}>
        <PageHeader title={t} sub={s} />
        <div className="group"><div className="card" style={{ minHeight: 420 }}>
          <EmptyState title="Not part of this prototype yet" sub="This screen will follow once the core screens are signed off." />
          <PixelCorner cols={22} rows={8} size={14} opacity={0.4} />
        </div></div>
      </div>
    )
  }

  return (
    <AppCtx.Provider value={{ route, go, range, setRange, mode, setMode, loading, collapsed, setCollapsed }}>
      <div className={'shell' + (navOpen ? ' nav-open' : '') + (collapsed ? ' collapsed' : '')}>
        <header className="topbar">
          <button className="btn icon-btn btn-ghost" aria-label="Open menu" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
          <WsTile size={24} />
          <span style={{ fontWeight: 500 }}>Ennead</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Tokencraft</span>
        </header>
        <Sidebar onNavigate={() => setNavOpen(false)} />
        <div className="scrim" onClick={() => setNavOpen(false)} />
        <main className="main" key={route}>{page}</main>
      </div>
      <div className="proto-dock" role="group" aria-label="Prototype data state">
        <span style={{ opacity: .7 }}>Data</span>
        <Seg<string> value={loading && mode === 'filled' ? 'Loading' : mode === 'empty' ? 'Empty' : 'Filled'}
          options={['Filled', 'Loading', 'Empty']}
          onChange={(v) => setMode(v.toLowerCase() as Mode)} />
      </div>
    </AppCtx.Provider>
  )
}
