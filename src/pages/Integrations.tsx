import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { Check, Code2, ExternalLink, Loader2, Webhook } from 'lucide-react'
import { PageHeader, Seg, useApp } from '../components/ui'
import { CopyButton, Sheet, Switch, toast } from '../components/overlay'

/**
 * Integrations: Tools (where Ferno sends what it finds) and Sources (where
 * events come from), as in the live app's two tabs. Connecting opens a sheet
 * with what Ferno will be allowed to do; connecting takes a moment, then the
 * card flips to Connected. Nothing leaves the prototype.
 */
type Item = {
  id: string; name: string; logo?: string; icon?: ReactNode; desc: string
  scopes: string[]; settings?: string[]; connected?: boolean; account?: string; popular?: boolean
}

const TOOLS: Item[] = [
  { id: 'slack', name: 'Slack', logo: 'slack', desc: 'Post new reports and weekly digests to a channel.', scopes: ['Post messages to channels you pick', 'Read channel names'], settings: ['New reports', 'Weekly digest', 'Failed investigations'], connected: true, account: '#product-signals', popular: true },
  { id: 'github', name: 'GitHub', logo: 'github', desc: 'Mark releases on charts and link reports to the commits behind them.', scopes: ['Read releases and tags', 'Read commit messages'], settings: ['Release markers on charts', 'Link reports to commits'], popular: true },
  { id: 'linear', name: 'Linear', logo: 'linear', desc: 'Turn a report into an issue with the evidence attached.', scopes: ['Create issues in teams you pick', 'Read team names'], settings: ['Attach charts to issues'] },
  { id: 'jira', name: 'Jira', logo: 'atlassian', desc: 'Create Jira issues from reports and next steps.', scopes: ['Create issues', 'Read projects'] },
  { id: 'notion', name: 'Notion', logo: 'notion', desc: 'Send reports to a Notion database as pages.', scopes: ['Create pages in a database you pick'] },
  { id: 'discord', name: 'Discord', logo: 'discord', desc: 'Post report summaries to a Discord channel.', scopes: ['Post messages via webhook'] },
  { id: 'webhooks', name: 'Webhooks', icon: <Webhook size={18} />, desc: 'Send report events to any URL as JSON.', scopes: ['Send POST requests to your endpoint'] },
]

const SOURCES: Item[] = [
  { id: 'script', name: 'Web script', icon: <Code2 size={18} />, desc: 'One script tag. Page views, clicks and sessions out of the box.', scopes: ['Collect page views, clicks and sessions'], connected: true, account: 'tokencrafter.vercel.app' },
  { id: 'nextjs', name: 'Next.js', logo: 'nextjs', desc: 'The npm package, with route changes and server events.', scopes: ['Collect client and server events'], popular: true },
  { id: 'vercel', name: 'Vercel', logo: 'vercel', desc: 'Deployments become release markers; Web Vitals come along.', scopes: ['Read deployments', 'Read Web Vitals'], settings: ['Release markers', 'Web Vitals'], connected: true, account: 'ennead/tokencraft' },
  { id: 'stripe', name: 'Stripe', logo: 'stripe', desc: 'Payments and subscriptions as events, for revenue funnels.', scopes: ['Read charges and subscriptions'] },
  { id: 'sentry', name: 'Sentry', logo: 'sentry', desc: 'Errors joined to sessions, so reports can blame a release.', scopes: ['Read issues and events'] },
  { id: 'posthog', name: 'PostHog', logo: 'posthog', desc: 'Import past events so reports have a baseline from day one.', scopes: ['Read events (one-time import)'] },
  { id: 'ga', name: 'Google Analytics', logo: 'google-analytics', desc: 'Import GA4 history for longer baselines.', scopes: ['Read GA4 reports'] },
]

const SNIPPET = `<script defer src="https://cdn.useferno.com/f.js"\n  data-project="tokencraft"></script>`

function Logo({ it, size = 22 }: { it: Item; size?: number }) {
  return it.logo ? <img src={`/logos/${it.logo}.svg`} alt="" width={size} height={size} style={{ objectFit: 'contain' }} /> : <>{it.icon}</>
}

// connections live for the session, so leaving the page mid-connect still finishes
type Conn = Record<string, { on: boolean; busy?: boolean }>
let conns: Conn = Object.fromEntries([...TOOLS, ...SOURCES].map((i) => [i.id, { on: !!i.connected }]))
const connSubs = new Set<() => void>()
const setConns = (f: (c: Conn) => Conn) => { conns = f(conns); connSubs.forEach((x) => x()) }
const useConns = () => useSyncExternalStore((f) => { connSubs.add(f); return () => connSubs.delete(f) }, () => conns)

export function Integrations() {
  const { mode } = useApp()
  const [tab, setTab] = useState<'Tools' | 'Sources'>('Tools')
  const live = useConns()
  // an empty project hasn't connected anything yet
  const state: Conn = mode === 'empty' ? Object.fromEntries(Object.keys(live).map((k) => [k, { on: false }])) : live
  const setState = setConns
  const [open, setOpen] = useState<Item | null>(null)
  const items = tab === 'Tools' ? TOOLS : SOURCES
  const connected = items.filter((i) => state[i.id]?.on).length

  const connect = (it: Item) => {
    setState((s) => ({ ...s, [it.id]: { on: false, busy: true } }))
    setTimeout(() => {
      setState((s) => ({ ...s, [it.id]: { on: true } }))
      toast(<>{it.name} connected</>)
    }, 1100)
  }
  const disconnect = (it: Item) => {
    setState((s) => ({ ...s, [it.id]: { on: false } }))
    setOpen(null)
    toast(<>{it.name} disconnected</>, { label: 'Undo', run: () => setState((s) => ({ ...s, [it.id]: { on: true } })) })
  }
  const cur = open ? state[open.id] : null

  return (
    <div className="page fade-page">
      <PageHeader title="Integrations" sub="Connect where events come from and where Ferno sends what it finds."
        right={<Seg value={tab} options={['Tools', 'Sources']} onChange={setTab} />} />
      <div className="group">
        <div className="group-banner"><b>{connected} of {items.length}</b>{tab === 'Tools' ? 'tools connected' : 'sources connected'}</div>
        <div className="int-grid">
          {items.map((it) => {
            const st = state[it.id]
            return (
              <div key={it.id} className="card int-card">
                <div className="int-top">
                  <span className="int-logo"><Logo it={it} /></span>
                  {st?.on ? <span className="chip-ok"><Check size={12} strokeWidth={2.5} />Connected</span> : it.popular ? <span className="chip-soft">Popular</span> : null}
                </div>
                <div className="int-name">{it.name}</div>
                <p className="int-desc">{it.desc}</p>
                {st?.on && it.account && <p className="int-acct mono">{it.account}</p>}
                <div className="int-foot">
                  {st?.on
                    ? <button className="btn" onClick={() => setOpen(it)}>Manage</button>
                    : <button className="btn btn-dark" disabled={st?.busy} onClick={() => setOpen(it)}>{st?.busy ? <><Loader2 size={14} className="spin" />Connecting…</> : 'Connect'}</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''} sub={open?.desc} icon={open && <Logo it={open} size={24} />}
        footer={open && (cur?.on
          ? <><button className="btn btn-danger" onClick={() => disconnect(open)}>Disconnect</button><button className="btn btn-dark" onClick={() => { setOpen(null); toast('Settings saved') }}>Done</button></>
          : <><button className="btn" onClick={() => setOpen(null)}>Cancel</button><button className="btn btn-dark" disabled={cur?.busy} onClick={() => { connect(open); setOpen(null) }}>Connect {open.name}</button></>)}>
        {open && (
          <>
            {open.id === 'script' || open.id === 'nextjs' ? (
              <section className="sheet-sec">
                <h3>Install</h3>
                <pre className="code">{open.id === 'script' ? SNIPPET : 'npm i @ferno/next\n\n// app/layout.tsx\nimport { Ferno } from "@ferno/next"\n<Ferno project="tokencraft" />'}</pre>
                <CopyButton text={open.id === 'script' ? SNIPPET : 'npm i @ferno/next'} label="Copy" />
              </section>
            ) : null}
            <section className="sheet-sec">
              <h3>Ferno will be able to</h3>
              <ul className="scopes">{open.scopes.map((s) => <li key={s}><Check size={14} />{s}</li>)}</ul>
              <p className="card-sub">It can't change anything in {open.name}{open.scopes.some((s) => /create|post|send/i.test(s)) ? ' beyond the above' : ''}. Disconnect any time.</p>
            </section>
            {open.settings && cur?.on && (
              <section className="sheet-sec">
                <h3>Settings</h3>
                {open.settings.map((s, i) => (
                  <div key={s} className="set-row"><span>{s}</span><SettingSwitch initial={i < 2} label={s} /></div>
                ))}
              </section>
            )}
            <a className="ext-link" href="#/docs"><ExternalLink size={13} />Read the {open.name} guide</a>
          </>
        )}
      </Sheet>
    </div>
  )
}

function SettingSwitch({ initial, label }: { initial: boolean; label: string }) {
  const [on, setOn] = useState(initial)
  return <Switch on={on} onChange={setOn} label={label} />
}
