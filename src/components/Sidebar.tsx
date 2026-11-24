import { useState } from 'react'
import { BookOpen, ChartLine, ChevronDown, ChevronsUpDown, FileText, KeyRound, LayoutDashboard, LogOut, MousePointerClick, Plus, Puzzle, Settings, Users, Check } from 'lucide-react'
import { FernoMark, useApp, useClickOutside } from './ui'

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
  const { route } = useApp()
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button className="nav-group-label" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}<ChevronDown size={14} />
      </button>
      <div className="nav-items" style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .25s cubic-bezier(.23,1,.32,1)' }}>
        <div style={{ minHeight: 0, display: 'grid', gap: 2 }}>
          {items.map((it) => (
            <button key={it.id} className={'nav-item' + (route === it.id || (it.id === 'agent' && route === 'chat') ? ' active' : '')} onClick={() => go(it.id)}>
              {it.icon}{it.label}
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
  const wsRef = useClickOutside(wsOpen, () => setWsOpen(false))
  const userRef = useClickOutside(userOpen, () => setUserOpen(false))
  return (
    <aside className="sidebar">
      <div className="ws-switch" ref={wsRef}>
        <button className="ws-switch-btn" onClick={() => setWsOpen((o) => !o)}>
          <WsTile />
          <span><div className="t">Ennead</div><div className="s">Tokencraft</div></span>
        </button>
        <button className="ws-chev" aria-label="Switch workspace" onClick={() => setWsOpen((o) => !o)}><ChevronsUpDown size={14} /></button>
        {wsOpen && (
          <div className="menu" style={{ width: '100%' }}>
            <div className="menu-label">Projects</div>
            <button className="menu-item" onClick={() => setWsOpen(false)}><WsTile size={20} />Tokencraft<Check size={15} className="check" /></button>
            <button className="menu-item" onClick={() => setWsOpen(false)}><span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--s2)' }} />Jewelcase</button>
            <button className="menu-item" onClick={() => setWsOpen(false)}><span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--s3)' }} />Egg Ledger</button>
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => setWsOpen(false)}><Plus size={16} />New project</button>
          </div>
        )}
      </div>

      <Group label="Workspace" items={WORKSPACE} go={go} />
      <div className="nav-sep" />
      <Group label="Manage" items={MANAGE} go={go} />

      <div className="sidebar-spacer" />
      <button className={'nav-item' + (route === 'docs' ? ' active' : '')} onClick={() => go('docs')}><BookOpen size={16} />Docs</button>
      <button className={'nav-item' + (route === 'settings' ? ' active' : '')} onClick={() => go('settings')}><Settings size={16} />Settings</button>

      <div className="select-wrap" ref={userRef}>
        <button className="user-card" onClick={() => setUserOpen((o) => !o)}>
          <UserTile />
          <span style={{ minWidth: 0, flex: 1 }}><div className="t">Alex Morgan</div><div className="s">alex@tokencraft.app</div></span>
          <ChevronsUpDown size={14} color="var(--n-600)" />
        </button>
        {userOpen && (
          <div className="menu up" style={{ width: '100%' }}>
            <button className="menu-item" onClick={() => { setUserOpen(false); go('settings') }}><Settings size={16} />Account settings</button>
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => { setUserOpen(false); go('signin') }}><LogOut size={16} />Sign out</button>
          </div>
        )}
      </div>
    </aside>
  )
}
