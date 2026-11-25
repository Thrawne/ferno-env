import { useEffect, useState } from 'react'
import { ArrowRight, Check, Radio } from 'lucide-react'
import { PageHeader, PixelLoader, Seg, useApp } from '../components/ui'
import { CopyButton, Field } from '../components/overlay'

/**
 * First run: name the project, install the script, wait for the first event.
 * The live app shows blank charts to a new project; this replaces that with a
 * path to data. "Send a test event" stands in for a real page load. Once
 * events arrive the project goes live and the dashboards fill in.
 */
const STEPS = ['Name it', 'Install', 'Check'] as const
type Arrived = { name: string; path: string; at: string }

export function Setup() {
  const { project, updateProject, go } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(project.empty && project.name !== 'Untitled' ? project.name : '')
  const [domain, setDomain] = useState(project.empty ? project.domain : '')
  const [how, setHow] = useState<'Script' | 'Next.js' | 'npm'>('Script')
  const [events, setEvents] = useState<Arrived[]>([])
  const [listening, setListening] = useState(false)

  const slug = (name || 'my-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const code = how === 'Script'
    ? `<script defer src="https://cdn.useferno.com/f.js"\n  data-project="${slug}"></script>`
    : how === 'Next.js'
      ? `// app/layout.tsx\nimport { Ferno } from '@ferno/next'\n\n<Ferno project="${slug}" />`
      : `npm i @ferno/web\n\nimport { init } from '@ferno/web'\ninit({ project: '${slug}' })`

  // test events land one by one, as a real first visit would
  useEffect(() => {
    if (!listening) return
    const t = [
      setTimeout(() => setEvents((e) => [...e, { name: 'page_view', path: '/', at: 'just now' }]), 1300),
      setTimeout(() => setEvents((e) => [...e, { name: 'click', path: '/ · “Get started”', at: 'just now' }]), 2100),
      setTimeout(() => setEvents((e) => [...e, { name: 'page_view', path: '/pricing', at: 'just now' }]), 2800),
    ]
    return () => t.forEach(clearTimeout)
  }, [listening])

  const finish = () => {
    updateProject({ ...project, name: name.trim() || project.name, domain: domain.trim() || project.domain, empty: false, k: 0.05 })
    go('overview')
  }

  return (
    <div className="page fade-page setup">
      <PageHeader title="Set up tracking" sub="Three steps, about two minutes. Ferno starts looking for changes as soon as events arrive." />
      <ol className="stepper" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <li key={s} data-state={i < step ? 'done' : i === step ? 'now' : 'next'} aria-current={i === step ? 'step' : undefined}>
            <span className="step-dot">{i < step ? <Check size={13} strokeWidth={2.5} /> : i + 1}</span>{s}
          </li>
        ))}
      </ol>
      <div className="group">
        <div className="card setup-card" key={step}>
          {step === 0 && (
            <>
              <h3>Name your project</h3>
              <p className="card-sub">One project per site or app. You can change these later in Settings.</p>
              <div className="set-fields">
                <Field label="Project name"><input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing site" /></Field>
                <Field label="Domain" hint="Events from other domains are dropped."><input className="input mono" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" /></Field>
              </div>
              <div className="setup-foot"><button className="btn btn-dark" disabled={!name.trim()} onClick={() => setStep(1)}>Continue<ArrowRight size={14} /></button></div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="setup-row"><h3>Add Ferno to your site</h3><Seg value={how} options={['Script', 'Next.js', 'npm']} onChange={setHow} /></div>
              <p className="card-sub">{how === 'Script' ? 'Paste this before the closing </head> tag on every page.' : how === 'Next.js' ? 'Install @ferno/next and render it once in your root layout.' : 'Install the package and call init once when your app starts.'}</p>
              <pre className="code">{code}</pre>
              <div className="setup-foot">
                <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
                <span style={{ flex: 1 }} />
                <CopyButton text={code} />
                <button className="btn btn-dark" onClick={() => setStep(2)}>I've added it<ArrowRight size={14} /></button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h3>{events.length ? 'Events are arriving' : 'Waiting for your first event'}</h3>
              <p className="card-sub">{events.length ? `Ferno is receiving events from ${domain || 'your site'}.` : `Open ${domain || 'your site'} in a new tab, or send a test event.`}</p>
              <div className="listen">
                {events.length === 0 ? (
                  <div className="listen-wait"><PixelLoader size={14} /><span className="listen-l"><Radio size={14} className={listening ? 'pulse' : ''} />{listening ? 'Listening…' : 'Not listening yet'}</span></div>
                ) : (
                  <ul className="arrived">{events.map((e, i) => (
                    <li key={i}><Check size={14} /><span className="mono">{e.name}</span><span className="muted mono">{e.path}</span><span className="muted">{e.at}</span></li>
                  ))}</ul>
                )}
              </div>
              <div className="setup-foot">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <span style={{ flex: 1 }} />
                {events.length < 3
                  ? <button className="btn" disabled={listening} onClick={() => setListening(true)}>{listening ? 'Sending…' : 'Send a test event'}</button>
                  : <button className="btn btn-dark" onClick={finish}>Go to Overview<ArrowRight size={14} /></button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
