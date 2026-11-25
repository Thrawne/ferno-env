import { useState } from 'react'
import { AlertTriangle, KeyRound, Plus } from 'lucide-react'
import { EmptyState, PageHeader, Seg, useApp } from '../components/ui'
import { CopyButton, Dialog, Field, toast } from '../components/overlay'

/**
 * API keys: the list shows only each key's last four characters. A new key
 * is shown in full exactly once, in the dialog that creates it. Revoking asks
 * first, because apps using the key stop sending events at once.
 * The keys are fake demo strings.
 */
type Key = { id: string; name: string; env: 'Live' | 'Test'; tail: string; created: string; used: string }

const SEED: Key[] = [
  { id: 'k1', name: 'Production web', env: 'Live', tail: '3f9a', created: 'Sep 2, 2026', used: '2 minutes ago' },
  { id: 'k2', name: 'Server events', env: 'Live', tail: 'b71c', created: 'Oct 14, 2026', used: '1 hour ago' },
  { id: 'k3', name: 'Staging', env: 'Test', tail: '04de', created: 'Nov 3, 2026', used: 'Nov 21, 2026' },
  { id: 'k4', name: 'Old marketing site', env: 'Live', tail: 'e2a8', created: 'Mar 9, 2026', used: 'Never' },
]

const rand = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

export function ApiKeys() {
  const { mode } = useApp()
  const [keys, setKeys] = useState<Key[]>(mode === 'empty' ? [] : SEED)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [env, setEnv] = useState<'Live' | 'Test'>('Live')
  const [made, setMade] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<Key | null>(null)

  const create = () => {
    const secret = `fk_${env.toLowerCase()}_demo_${rand(24)}`
    setKeys((k) => [{ id: 'k' + Date.now(), name: name.trim() || 'Untitled key', env, tail: secret.slice(-4), created: 'Just now', used: 'Never' }, ...k])
    setMade(secret)
  }
  const closeCreate = () => { setCreating(false); setMade(null); setName(''); setEnv('Live') }
  const revoke = (k: Key) => {
    setKeys((ks) => ks.filter((x) => x.id !== k.id))
    setRevoking(null)
    toast(<>Revoked “{k.name}”</>)
  }

  return (
    <div className="page fade-page">
      <PageHeader title="API Keys" count={keys.length} sub="Keys your apps use to send events to Ferno. Keep live keys on the server."
        right={<button className="btn btn-dark" onClick={() => setCreating(true)}><Plus size={14} />Create key</button>} />
      <div className="group">
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {keys.length === 0 ? (
            <div style={{ height: 300 }}><EmptyState icon={<KeyRound size={28} color="var(--accent-400)" />} title="No API keys yet" sub="Create a key to send events from your server or app." /></div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last used</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td><span className="cell-t">{k.name}</span> <span className={'env ' + k.env.toLowerCase()}>{k.env}</span></td>
                    <td className="mono">fk_{k.env.toLowerCase()}_••••••••{k.tail}</td>
                    <td className="muted">{k.created}</td>
                    <td className={k.used === 'Never' ? 'muted' : ''}>{k.used}</td>
                    <td className="tbl-act"><button className="btn btn-ghost danger-ghost" onClick={() => setRevoking(k)}>Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={creating} onClose={closeCreate} title={made ? 'Copy your new key' : 'Create an API key'}
        sub={made ? 'This is the only time the full key is shown. Store it somewhere safe.' : 'Name it after the app that will use it, so you know what breaks if you revoke it.'}
        footer={made
          ? <button className="btn btn-dark" onClick={closeCreate}>I've saved it</button>
          : <><button className="btn" onClick={closeCreate}>Cancel</button><button className="btn btn-dark" onClick={create}>Create key</button></>}>
        {made ? (
          <>
            <div className="secret"><code className="mono">{made}</code><CopyButton text={made} /></div>
            <p className="note"><AlertTriangle size={14} />Demo key. It doesn't work outside this prototype.</p>
          </>
        ) : (
          <>
            <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production web" onKeyDown={(e) => e.key === 'Enter' && create()} /></Field>
            <Field label="Environment" hint={env === 'Live' ? 'Events count toward your reports.' : 'Events are kept apart and never trigger reports.'}>
              <span><Seg value={env} options={['Live', 'Test']} onChange={setEnv} /></span>
            </Field>
          </>
        )}
      </Dialog>

      <Dialog open={!!revoking} onClose={() => setRevoking(null)} tone="danger" title={`Revoke “${revoking?.name ?? ''}”?`}
        sub="Apps using this key stop sending events right away. This can't be undone."
        footer={<><button className="btn" onClick={() => setRevoking(null)}>Cancel</button><button className="btn btn-danger-solid" onClick={() => revoking && revoke(revoking)}>Revoke key</button></>} />
    </div>
  )
}
