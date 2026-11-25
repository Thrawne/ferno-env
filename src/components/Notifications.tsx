import { useCallback, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, Bell, FileText, Plug, UserPlus } from 'lucide-react'
import { Popover, useApp } from './ui'

/**
 * The bell: new reports, failures, joins and integrations, newest first.
 * Unread ones carry a dot; opening one marks it read and goes to it.
 */
type Note = { id: string; icon: ReactNode; title: string; body: string; when: string; to: string; unread: boolean }
const SEED: Note[] = [
  { id: 'n1', icon: <FileText size={15} />, title: 'New report', body: 'Dead clicks on the pricing toggle jumped tenfold', when: '4h ago', to: 'report/pricing-dead-clicks', unread: true },
  { id: 'n2', icon: <FileText size={15} />, title: 'Findings ready', body: 'Sign-ups dipped 2.1% after the Nov 19 release', when: 'Yesterday', to: 'report/signup-dip', unread: true },
  { id: 'n3', icon: <AlertCircle size={15} />, title: 'Investigation stopped', body: 'rage_click rose from 1 to 10 a day. Run it again.', when: 'Oct 31', to: 'report/rage-failed', unread: true },
  { id: 'n4', icon: <UserPlus size={15} />, title: 'Priya joined', body: 'Priya Natarajan accepted your invite as Admin.', when: 'Nov 20', to: 'members', unread: false },
  { id: 'n5', icon: <Plug size={15} />, title: 'Vercel connected', body: 'Deployments now show as release markers.', when: 'Nov 18', to: 'integrations', unread: false },
]

export function Notifications({ compact }: { compact?: boolean }) {
  const { go, mode } = useApp()
  const [notes, setNotes] = useState(SEED)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const list = mode === 'empty' ? [] : notes
  const unread = list.filter((n) => n.unread).length
  return (
    <div className="select-wrap" ref={ref}>
      <button className={'bell' + (compact ? ' compact' : '')} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} onClick={() => setOpen((o) => !o)} data-tip="Notifications">
        <Bell size={16} />{unread > 0 && <span className="bell-n num">{unread}</span>}
      </button>
      <Popover anchor={ref} open={open} onClose={close} matchWidth={false} minWidth={340} label="Notifications">
        <div className="notes">
          <div className="notes-h"><span>Notifications</span>{unread > 0 && <button className="btn btn-ghost" onClick={() => setNotes((ns) => ns.map((n) => ({ ...n, unread: false })))}>Mark all read</button>}</div>
          {list.length === 0 ? <p className="notes-empty">You're all caught up.</p> : list.map((n) => (
            <button key={n.id} className={'note' + (n.unread ? ' unread' : '')} onClick={() => { setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x))); setOpen(false); go(n.to) }}>
              <span className="note-ico">{n.icon}</span>
              <span className="note-main"><span className="note-t">{n.title}<span className="note-w">{n.when}</span></span><span className="note-b">{n.body}</span></span>
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}
