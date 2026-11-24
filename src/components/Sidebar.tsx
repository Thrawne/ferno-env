import { useCallback, useRef, useState } from 'react'
import { BookOpen, ChartLine, ChevronDown, ChevronsUpDown, FileText, KeyRound, LayoutDashboard, LogOut, MousePointerClick, Plus, Puzzle, Settings, Users, Check } from 'lucide-react'
import { FernoMark, Popover, useApp } from './ui'

const WORKSPACE = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'agent', label: 'Ferno Agent', icon: <FernoMark size={18} /> },
  { id: 'heatmaps', label: 'Heatmaps', icon: <MousePointerClick size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <ChartLine size={16} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
]
const MANAGE = [
  { id: 'members', label: 'Members', icon: <Users size={16} /> },
  { id: 'api-keys', label: 'API Keys', icon: <KeyRound size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Puzzle size={16} /> },
]

/* Exported from Figma: Ferno/Sidebar › workspace tile and user avatar */
export function WsTile({ size = 28 }: { size?: number }) {
  return <img src="/brand/workspace.svg" width={size} height={size} alt="" aria-hidden style={{ flexShrink: 0, borderRadius: 4 }} />
}
function UserTile() {
  return <img src="/brand/user-avatar.svg" width={32} height={32} alt="" aria-hidden style={{ flexShrink: 0, borderRadius: 4 }} />
}

function Group({ label, items, go }: { label: string; items: typeof WORKSPACE; go: (r: string) => void }) {
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
            <button key={it.id} className={'nav-item' + (route === it.id || (it.id === 'agent' && route === 'chat') ? ' active' : '')} onClick={() => go(it.id)}
              data-tip={it.label} aria-label={collapsed ? it.label : undefined}>
              <span className="nav-ico">{it.icon}</span><span className="nav-label">{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { go: rawGo, route } = useApp()
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
        <button className="ws-switch-btn" onClick={() => setWsOpen((o) => !o)} data-tip="Ennead · Tokencraft">
          <WsTile />
          <span className="nav-label"><div className="t">Ennead</div><div className="s">Tokencraft</div></span>
        </button>
        <button className="ws-chev" aria-label="Switch workspace" onClick={() => setWsOpen((o) => !o)}><ChevronsUpDown size={14} /></button>
        <Popover anchor={wsRef} open={wsOpen} onClose={closeWs} label="Projects">
            <div className="menu-label">Projects</div>
            <button className="menu-item" onClick={() => setWsOpen(false)}><WsTile size={20} />Tokencraft<Check size={15} className="check" /></button>
            <button className="menu-item" onClick={() => setWsOpen(false)}><span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--s2)' }} />Jewelcase</button>
            <button className="menu-item" onClick={() => setWsOpen(false)}><span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--s3)' }} />Egg Ledger</button>
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => setWsOpen(false)}><Plus size={16} />New project</button>
        </Popover>
      </div>

      <Group label="Workspace" items={WORKSPACE} go={go} />
      <div className="nav-sep" />
      <Group label="Manage" items={MANAGE} go={go} />

      <div className="sidebar-spacer" />
      <button className={'nav-item' + (route === 'docs' ? ' active' : '')} onClick={() => go('docs')} data-tip="Docs"><span className="nav-ico"><BookOpen size={16} /></span><span className="nav-label">Docs</span></button>
      <button className={'nav-item' + (route === 'settings' ? ' active' : '')} onClick={() => go('settings')} data-tip="Settings"><span className="nav-ico"><Settings size={16} /></span><span className="nav-label">Settings</span></button>

      <div className="select-wrap" ref={userRef}>
        <button className="user-card" onClick={() => setUserOpen((o) => !o)} data-tip="Alex Morgan">
          <UserTile />
          <span className="nav-label" style={{ minWidth: 0, flex: 1 }}><div className="t">Alex Morgan</div><div className="s">alex@tokencraft.app</div></span>
          <ChevronsUpDown className="user-chev" size={14} color="var(--n-600)" />
        </button>
        <Popover anchor={userRef} open={userOpen} onClose={closeUser} label="Account">
          <button className="menu-item" onClick={() => { setUserOpen(false); go('settings') }}><Settings size={16} />Account settings</button>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => { setUserOpen(false); go('signin') }}><LogOut size={16} />Sign out</button>
        </Popover>
      </div>
    </aside>
  )
}
