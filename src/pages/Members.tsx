import { useState } from 'react'
import { Mail, Plus } from 'lucide-react'
import { PageHeader, Select } from '../components/ui'
import { Dialog, Field, Initials, toast } from '../components/overlay'

/**
 * Members: who's in the workspace and what they can do. You (the owner) can't
 * demote yourself; everyone else's role changes in place. Invites wait in
 * their own list until accepted, and can be resent or cancelled.
 * All people here are made up.
 */
type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer'
const ROLES: Role[] = ['Admin', 'Member', 'Viewer']
const ROLE_HELP: Record<Role, string> = {
  Owner: 'Everything, including billing and deleting the workspace.',
  Admin: 'Manage members, keys and integrations.',
  Member: 'Use every page and ask Ferno.',
  Viewer: 'Read dashboards and reports only.',
}

type Person = { id: string; name: string; email: string; role: Role; active: string; you?: boolean }
const SEED: Person[] = [
  { id: 'p1', name: 'Alex Morgan', email: 'alex@tokencraft.app', role: 'Owner', active: 'Now', you: true },
  { id: 'p2', name: 'Priya Natarajan', email: 'priya@tokencraft.app', role: 'Admin', active: '12 minutes ago' },
  { id: 'p3', name: 'Tomás Ortega', email: 'tomas@tokencraft.app', role: 'Member', active: 'Yesterday' },
  { id: 'p4', name: 'Mei Lin', email: 'mei@tokencraft.app', role: 'Member', active: 'Nov 21' },
  { id: 'p5', name: 'Jordan Blake', email: 'jordan@agency.studio', role: 'Viewer', active: 'Nov 8' },
]
type Invite = { email: string; role: Role; sent: string }

export function Members() {
  const [people, setPeople] = useState(SEED)
  const [invites, setInvites] = useState<Invite[]>([{ email: 'sam@tokencraft.app', role: 'Member', sent: '2 days ago' }])
  const [open, setOpen] = useState(false)
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<Role>('Member')
  const [removing, setRemoving] = useState<Person | null>(null)

  const parsed = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
  const bad = parsed.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  const send = () => {
    if (!parsed.length || bad.length) return
    setInvites((v) => [...parsed.map((email) => ({ email, role, sent: 'Just now' })), ...v])
    toast(parsed.length === 1 ? <>Invite sent to {parsed[0]}</> : <>{parsed.length} invites sent</>)
    setOpen(false); setEmails(''); setRole('Member')
  }

  return (
    <div className="page fade-page">
      <PageHeader title="Members" count={people.length} sub="Who can see this workspace, and what they can change."
        right={<button className="btn btn-dark" onClick={() => setOpen(true)}><Plus size={14} />Invite</button>} />
      <div className="group">
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Last active</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="person"><Initials name={p.name} />
                      <span><span className="cell-t">{p.name}{p.you && <span className="you">You</span>}</span><span className="cell-s">{p.email}</span></span>
                    </span>
                  </td>
                  <td style={{ width: 160 }}>
                    {p.role === 'Owner' ? <span className="role-fixed" title={ROLE_HELP.Owner}>Owner</span> : (
                      <Select<Role> value={p.role} width={132}
                        options={ROLES.map((r) => ({ value: r, label: r }))}
                        onChange={(r) => { setPeople((ps) => ps.map((x) => (x.id === p.id ? { ...x, role: r } : x))); toast(<>{p.name.split(' ')[0]} is now {r === 'Admin' ? 'an' : 'a'} {r}</>) }} />
                    )}
                  </td>
                  <td className="muted">{p.active}</td>
                  <td className="tbl-act">{!p.you && <button className="btn btn-ghost danger-ghost" onClick={() => setRemoving(p)}>Remove</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invites.length > 0 && (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div className="tbl-cap">Pending invites <span className="num">{invites.length}</span></div>
            <table className="tbl">
              <tbody>
                {invites.map((v) => (
                  <tr key={v.email}>
                    <td><span className="person"><span className="initials ghost"><Mail size={13} /></span><span className="cell-t">{v.email}</span></span></td>
                    <td style={{ width: 160 }} className="muted">{v.role}</td>
                    <td className="muted">Sent {v.sent}</td>
                    <td className="tbl-act">
                      <button className="btn btn-ghost" onClick={() => { setInvites((x) => x.map((i) => (i.email === v.email ? { ...i, sent: 'Just now' } : i))); toast(<>Invite resent to {v.email}</>) }}>Resend</button>
                      <button className="btn btn-ghost danger-ghost" onClick={() => { setInvites((x) => x.filter((i) => i.email !== v.email)); toast('Invite cancelled') }}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Invite to Ennead" sub="They'll get an email with a link to join."
        footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-dark" disabled={!parsed.length || bad.length > 0} onClick={send}>{parsed.length > 1 ? `Send ${parsed.length} invites` : 'Send invite'}</button></>}>
        <Field label="Email addresses" hint={bad.length ? <span className="err">Check {bad.slice(0, 2).join(', ')}{bad.length > 2 ? '…' : ''}</span> : 'Separate several with commas.'}>
          <textarea className="input" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="name@company.com, another@company.com" />
        </Field>
        <Field label="Role" hint={ROLE_HELP[role]}>
          <Select<Role> value={role} options={ROLES.map((r) => ({ value: r, label: r }))} onChange={setRole} />
        </Field>
      </Dialog>

      <Dialog open={!!removing} onClose={() => setRemoving(null)} tone="danger" title={`Remove ${removing?.name ?? ''}?`}
        sub="They lose access straight away. Their chats and reports stay in the workspace."
        footer={<><button className="btn" onClick={() => setRemoving(null)}>Cancel</button><button className="btn btn-danger-solid" onClick={() => {
          const p = removing!; setPeople((ps) => ps.filter((x) => x.id !== p.id)); setRemoving(null)
          toast(<>Removed {p.name}</>, { label: 'Undo', run: () => setPeople((ps) => [...ps, p]) })
        }}>Remove</button></>} />
    </div>
  )
}
