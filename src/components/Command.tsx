import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen, ChartLine, Compass, FileText, FolderOpen, History, KeyRound, LayoutDashboard, Lightbulb, Moon, MousePointerClick,
  Plus, Puzzle, Rocket, Search, Settings, Sun, UserPlus, Users, Zap,
} from 'lucide-react'
import { FernoMark, useApp } from './ui'
import { useReports } from '../reports'
import { useThreads } from '../chats'

/**
 * ⌘K / Ctrl+K from anywhere: jump to a page, project, report or chat, run an
 * action, or ask Ferno whatever you typed. Arrow keys move, Enter runs,
 * Escape closes. Matching is plain substring on the label and keywords.
 */
type Cmd = { id: string; group: string; label: string; icon: ReactNode; hint?: string; keys?: string; run: () => void }

export function CommandPalette({ open, onClose, onAsk, onNewProject }: { open: boolean; onClose: () => void; onAsk: (q: string) => void; onNewProject: () => void }) {
  const { go, projects, project, setProject, theme, setTheme, startTour } = useApp()
  const reports = useReports()
  const threads = useThreads()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // reset on open and hand focus back on close; the input takes focus itself (autoFocus) as it mounts
  useEffect(() => {
    if (!open) return
    setQ(''); setI(0)
    const back = document.activeElement as HTMLElement | null
    return () => back?.focus?.()
  }, [open])

  const all = useMemo<Cmd[]>(() => {
    const nav = (id: string, label: string, icon: ReactNode, keys = ''): Cmd => ({ id: 'go-' + id, group: 'Go to', label, icon, keys, run: () => go(id) })
    return [
      nav('overview', 'Overview', <LayoutDashboard size={16} />, 'home dashboard kpi'),
      nav('events', 'Events', <Zap size={16} />, 'event explorer names'),
      nav('agent', 'Ferno Agent', <FernoMark size={16} />, 'ask chat ai'),
      nav('chats', 'Chat history', <History size={16} />, 'conversations past'),
      nav('heatmaps', 'Heatmaps', <MousePointerClick size={16} />, 'clicks rage'),
      nav('analytics', 'Analytics', <ChartLine size={16} />, 'traffic visitors sources'),
      nav('reports', 'Reports', <FileText size={16} />, 'investigations anomalies'),
      nav('members', 'Members', <Users size={16} />, 'team people roles'),
      nav('api-keys', 'API Keys', <KeyRound size={16} />, 'tokens secret'),
      nav('integrations', 'Integrations', <Puzzle size={16} />, 'slack github sources tools'),
      nav('settings', 'Settings', <Settings size={16} />, 'timezone retention preferences'),
      nav('docs', 'Docs', <BookOpen size={16} />, 'guides help'),
      nav('tips', 'All tips', <Lightbulb size={16} />, 'tooltips help'),
      { id: 'a-chat', group: 'Actions', label: 'New chat', icon: <Plus size={16} />, keys: 'ask question', run: () => go('agent') },
      { id: 'a-invite', group: 'Actions', label: 'Invite a teammate', icon: <UserPlus size={16} />, keys: 'members add', run: () => go('members') },
      { id: 'a-key', group: 'Actions', label: 'Create an API key', icon: <KeyRound size={16} />, run: () => go('api-keys') },
      { id: 'a-setup', group: 'Actions', label: 'Set up tracking', icon: <Rocket size={16} />, keys: 'install script snippet onboarding', run: () => go('setup') },
      { id: 'a-project', group: 'Actions', label: 'New project', icon: <Plus size={16} />, keys: 'create', run: onNewProject },
      { id: 'a-theme', group: 'Actions', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, keys: 'theme appearance dark light', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { id: 'a-tour', group: 'Actions', label: 'Take the tour', icon: <Compass size={16} />, keys: 'help guide onboarding', run: startTour },
      ...projects.filter((p) => p.id !== project.id).map((p): Cmd => ({ id: 'p-' + p.id, group: 'Projects', label: `Switch to ${p.name}`, icon: <FolderOpen size={16} />, hint: p.domain, keys: p.domain, run: () => setProject(p.id) })),
      ...reports.slice(0, 6).map((r): Cmd => ({ id: 'r-' + r.id, group: 'Reports', label: r.title, icon: <FileText size={16} />, keys: r.event + ' ' + r.page, run: () => go('report/' + r.id) })),
      ...threads.slice(0, 5).map((t): Cmd => ({ id: 't-' + t.id, group: 'Chats', label: t.title, icon: <History size={16} />, hint: t.when, run: () => go('chat/' + t.id) })),
    ]
  }, [go, projects, project.id, setProject, theme, setTheme, startTour, reports, threads, onNewProject])

  const term = q.trim().toLowerCase()
  const hits = term ? all.filter((c) => (c.label + ' ' + (c.keys ?? '') + ' ' + c.group).toLowerCase().includes(term)) : all.filter((c) => c.group !== 'Chats' && c.group !== 'Reports')
  const list: Cmd[] = term ? [...hits, { id: 'ask', group: 'Ask Ferno', label: `Ask Ferno: “${q.trim()}”`, icon: <FernoMark size={16} />, run: () => onAsk(q.trim()) }] : hits
  const cur = Math.min(i, list.length - 1)

  useEffect(() => { listRef.current?.querySelector(`[data-i="${cur}"]`)?.scrollIntoView({ block: 'nearest' }) }, [cur])

  if (!open) return null
  const run = (c: Cmd) => { onClose(); c.run() }
  let lastGroup = ''
  return createPortal(
    <div className="ov ov-cmd" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cmd" role="dialog" aria-modal="true" aria-label="Command menu">
        <div className="cmd-in">
          <Search size={16} />
          <input ref={input} autoFocus value={q} placeholder="Search pages, reports, chats, or ask Ferno…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-activedescendant={list[cur] ? 'cmd-' + list[cur].id : undefined}
            onChange={(e) => { setQ(e.target.value); setI(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
              else if (e.key === 'Enter' && list[cur]) { e.preventDefault(); run(list[cur]) }
              else if (e.key === 'Escape') { e.preventDefault(); onClose() }
            }} />
          <kbd>esc</kbd>
        </div>
        <div className="cmd-list" id="cmd-list" role="listbox" ref={listRef}>
          {list.map((c, n) => {
            const head = c.group !== lastGroup ? (lastGroup = c.group) : null
            return (
              <div key={c.id}>
                {head && <div className="cmd-g">{head}</div>}
                <button id={'cmd-' + c.id} data-i={n} role="option" aria-selected={n === cur} className="cmd-item" onMouseMove={() => setI(n)} onClick={() => run(c)}>
                  <span className="cmd-ico">{c.icon}</span><span className="cmd-l">{c.label}</span>{c.hint && <span className="cmd-h mono">{c.hint}</span>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="cmd-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>⌘</kbd><kbd>K</kbd> anywhere</span></div>
      </div>
    </div>,
    document.body,
  )
}
