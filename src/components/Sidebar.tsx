import { useCallback, useRef, useState } from 'react'
import { BookOpen, ChartLine, ChevronDown, ChevronsUpDown, Compass, Globe, Lightbulb, FileText, KeyRound, LayoutDashboard, LogOut, MessageSquare, Moon, MousePointerClick, Plus, Puzzle, Search, Settings, Users, Check, Zap } from 'lucide-react'
import { TextMorph } from 'torph/react'
import type { ReactNode } from 'react'
import { FernoMark, Popover, useApp } from './ui'
import { Notifications } from './Notifications'
import { Switch } from './overlay'

const WORKSPACE = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'agent', label: 'Ferno Agent', icon: <FernoMark size={18} /> },
  { id: 'heatmaps', label: 'Heatmaps', icon: <MousePointerClick size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <ChartLine size={16} /> },
  { id: 'events', label: 'Events', icon: <Zap size={16} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
]
type Item = { id: string; label: string; icon: ReactNode; onClick?: () => void; trail?: ReactNode }
const MANAGE = [
  { id: 'members', label: 'Members', icon: <Users size={16} /> },
  { id: 'api-keys', label: 'API Keys', icon: <KeyRound size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Puzzle size={16} /> },
]

/* Exported from Figma: Ferno/Sidebar › workspace tile and user avatar */
export function WsTile({ size = 28 }: { size?: number }) {
  return <img src="/brand/workspace.svg" width={size} height={size} alt="" aria-hidden style={{ flexShrink: 0, borderRadius: 4 }} />
}
/** Tokencraft keeps its Figma tile; other projects get a tinted square, grey while empty. */
const TILE: Record<string, string> = { 'ferno-web': 'var(--s1)', northwind: 'var(--s2)' }
export function ProjectTile({ id, size = 28 }: { id: string; size?: number }) {
  const { projects } = useApp()
  if (id === 'tokencraft') return <WsTile size={size} />
  const p = projects.find((x) => x.id === id)
  const bg = p?.empty ? 'var(--n-200)' : TILE[id] ?? 'var(--s4)'
  return <span aria-hidden className="proj-tile" style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>{p?.name[0] ?? '?'}</span>
}
function UserTile() {
  return <img src="/brand/user-avatar.svg" width={32} height={32} alt="" aria-hidden style={{ flexShrink: 0, borderRadius: 4 }} />
}

function Group({ label, items, go }: { label: string; items: Item[]; go: (r: string) => void }) {
  const { route, collapsed } = useApp()
  const [openState, setOpen] = useState(true)
  const open = openState || collapsed // the icon rail always shows every item
  return (
    <div>
      <button className="nav-group-label" aria-expanded={open} onClick={() => setOpen((o) => !o)} tabIndex={collapsed ? -1 : 0}>
        <span className="nav-label">{label}</span><ChevronDown size={14} />
      </button>
      <div className="nav-items" style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .25s cubic-bezier(.23,1,.32,1)' }}>
        <div style={{ minHeight: 0, display: 'grid', gap: 2 }}>
          {items.map((it) => (
            <button key={it.id} className={'nav-item' + (route === it.id || (it.id === 'agent' && route === 'chat') || (it.id === 'reports' && route.startsWith('report/')) || (it.id === 'agent' && (route.startsWith('chat') || route === 'chats')) || (it.id === 'events' && route.startsWith('event/')) ? ' active' : '')} onClick={() => (it.onClick ? it.onClick() : go(it.id))}
              data-tip={it.label} aria-label={collapsed ? it.label : undefined}>
              <span className="nav-ico">{it.icon}</span><span className="nav-label">{it.label}</span>{it.trail}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { go: rawGo, route, tipStyle, setTipStyle, startTour, projects, project, setProject, newProject, theme, setTheme, openPalette } = useApp()
  // prototype-only controls, kept apart from the product's own navigation
  const PROTO: Item[] = [
    { id: 'landing', label: 'Landing page', icon: <Globe size={16} /> },
    { id: 'tips', label: 'All tips', icon: <Lightbulb size={16} /> },
    { id: 'proto-tour', label: 'Take the tour', icon: <Compass size={16} />, onClick: () => { startTour(); onNavigate?.() } },
    {
      id: 'proto-tips', label: 'Tooltip style', icon: <MessageSquare size={16} />, onClick: () => setTipStyle(tipStyle === 'figma' ? 'classic' : 'figma'),
      trail: <span className="nav-trail nav-label"><TextMorph>{tipStyle === 'figma' ? 'New' : 'Classic'}</TextMorph></span>,
    },
  ]
  const go = (r: string) => { rawGo(r); onNavigate?.() }
  const [wsOpen, setWsOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const wsRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const closeWs = useCallback(() => setWsOpen(false), [])
  const closeUser = useCallback(() => setUserOpen(false), [])
  return (
    <aside className="sidebar">
      <div className="ws-switch" ref={wsRef}>
        <button className="ws-switch-btn" onClick={() => setWsOpen((o) => !o)} data-tip={`Ennead · ${project.name}`}>
          <ProjectTile id={project.id} />
          <span className="nav-label"><span className="t">Ennead</span><span className="s"><TextMorph>{project.name}</TextMorph></span></span>
        </button>
        <button className="ws-chev" aria-label="Switch workspace" onClick={() => setWsOpen((o) => !o)}><ChevronsUpDown size={14} /></button>
        <Popover anchor={wsRef} open={wsOpen} onClose={closeWs} label="Projects">
            <div className="menu-label">Projects in Ennead</div>
            {projects.map((p) => (
              <button key={p.id} className="menu-item" onClick={() => { setWsOpen(false); setProject(p.id) }}>
                <ProjectTile id={p.id} size={20} />
                <span className="proj-t"><span>{p.name}</span><span className="proj-s mono">{p.empty ? 'No events yet' : p.domain}</span></span>
                {p.id === project.id && <Check size={15} className="check" />}
              </button>
            ))}
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => { setWsOpen(false); newProject(); onNavigate?.() }}><Plus size={16} />New project</button>
        </Popover>
      </div>

      <div className="sb-tools">
        <button className="sb-search" onClick={() => { openPalette(); onNavigate?.() }} data-tip="Search (⌘K)">
          <Search size={15} /><span className="nav-label">Search</span><kbd className="nav-label">⌘K</kbd>
        </button>
        <Notifications />
      </div>

      <Group label="Workspace" items={WORKSPACE} go={go} />
      <div className="nav-sep" />
      <Group label="Manage" items={MANAGE} go={go} />
      <div className="nav-sep" />
      <Group label="Prototype" items={PROTO} go={go} />

      <div className="sidebar-spacer" />
      <button className={'nav-item' + (route === 'docs' ? ' active' : '')} onClick={() => go('docs')} data-tip="Docs"><span className="nav-ico"><BookOpen size={16} /></span><span className="nav-label">Docs</span></button>
      <button className={'nav-item' + (route === 'settings' ? ' active' : '')} onClick={() => go('settings')} data-tip="Settings"><span className="nav-ico"><Settings size={16} /></span><span className="nav-label">Settings</span></button>

      <div className="select-wrap" ref={userRef}>
        <button className="user-card" onClick={() => setUserOpen((o) => !o)} data-tip="Alex Morgan">
          <UserTile />
          <span className="nav-label" style={{ minWidth: 0, flex: 1 }}><span className="t">Alex Morgan</span><span className="s">alex@tokencraft.app</span></span>
          <ChevronsUpDown className="user-chev" size={14} color="var(--n-600)" />
        </button>
        <Popover anchor={userRef} open={userOpen} onClose={closeUser} label="Account">
          <button className="menu-item" onClick={() => { setUserOpen(false); go('settings') }}><Settings size={16} />Account settings</button>
          <div className="menu-item" role="presentation" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Moon size={16} />Dark mode<span style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}><Switch on={theme === 'dark'} onChange={(v) => setTheme(v ? 'dark' : 'light')} label="Dark mode" /></span>
          </div>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => { setUserOpen(false); go('signin') }}><LogOut size={16} />Sign out</button>
        </Popover>
      </div>
    </aside>
  )
}
