import { useState } from 'react'
import { PageHeader, Seg, Select, useApp } from '../components/ui'
import { Dialog, Field, Switch, toast } from '../components/overlay'
import { MIN_USERS } from '../reports'

/**
 * Settings for the current project. Edits collect in a draft; a bar slides up
 * to save or discard them. Theme applies at once (it's per device, not per
 * project). Deleting the project asks you to type its name.
 */
type Draft = { name: string; domain: string; tz: string; retention: string; anonymize: boolean; internal: boolean }
const TZS = ['Africa/Lagos', 'Europe/London', 'America/New_York', 'Asia/Kolkata', 'UTC']
const KEEP = ['90 days', '1 year', '2 years', '5 years']

export function Settings() {
  const { project, theme, setTheme } = useApp()
  const initial: Draft = { name: project.name, domain: project.domain, tz: 'Africa/Lagos', retention: '1 year', anonymize: true, internal: false }
  const [saved, setSaved] = useState(initial)
  const [d, setD] = useState(initial)
  const [del, setDel] = useState(false)
  const [typed, setTyped] = useState('')
  const dirty = JSON.stringify(d) !== JSON.stringify(saved)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  return (
    <div className="page fade-page settings">
      <PageHeader title="Settings" sub={`Preferences for ${project.name} and this device.`} />
      <div className="group">
        <section className="card set-sec">
          <div className="set-h"><h3>Project</h3><p>What Ferno calls it, and where it runs.</p></div>
          <div className="set-fields">
            <Field label="Name"><input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Domain" hint="Events from other domains are dropped."><input className="input mono" value={d.domain} onChange={(e) => set('domain', e.target.value)} /></Field>
          </div>
        </section>
        <section className="card set-sec">
          <div className="set-h"><h3>Data</h3><p>How events are stored and counted.</p></div>
          <div className="set-fields">
            <Field label="Default timezone" hint="Visitors whose browser sends no timezone are counted here, so Region never shows a lone “Unknown”.">
              <Select value={d.tz} onChange={(v) => set('tz', v)} options={TZS.map((t) => ({ value: t, label: <span className="mono">{t}</span> }))} />
            </Field>
            <Field label="Keep raw events for" hint="Totals and reports are kept after raw events expire.">
              <Select value={d.retention} onChange={(v) => set('retention', v)} options={KEEP.map((k) => ({ value: k, label: k }))} />
            </Field>
            <div className="set-row"><span><b>Anonymise IP addresses</b><span className="cell-s">Drop the last part of every IP before storing it.</span></span><Switch on={d.anonymize} onChange={(v) => set('anonymize', v)} label="Anonymise IP addresses" /></div>
            <div className="set-row"><span><b>Exclude your team's traffic</b><span className="cell-s">Ignore visits from signed-in workspace members.</span></span><Switch on={d.internal} onChange={(v) => set('internal', v)} label="Exclude your team's traffic" /></div>
            <div className="set-row"><span><b>Percent changes on small numbers</b><span className="cell-s">Below {MIN_USERS} users the change shows as a count (“3 → 41”), not a runaway percentage.</span></span><span className="chip-soft">Always on</span></div>
          </div>
        </section>
        <section className="card set-sec">
          <div className="set-h"><h3>Appearance</h3><p>Applies on this device straight away.</p></div>
          <div className="set-fields">
            <Field label="Theme"><span><Seg value={theme === 'dark' ? 'Dark' : 'Light'} options={['Light', 'Dark']} onChange={(v) => setTheme(v === 'Dark' ? 'dark' : 'light')} /></span></Field>
          </div>
        </section>
        <section className="card set-sec danger-zone">
          <div className="set-h"><h3>Delete project</h3><p>Removes every event, report and chat in {project.name}. This can't be undone.</p></div>
          <div><button className="btn btn-danger" onClick={() => setDel(true)}>Delete {project.name}</button></div>
        </section>
      </div>

      <div className={'save-bar' + (dirty ? ' on' : '')} aria-hidden={!dirty}>
        <span>Unsaved changes</span>
        <button className="btn btn-ghost" tabIndex={dirty ? 0 : -1} onClick={() => setD(saved)}>Discard</button>
        <button className="btn btn-dark" tabIndex={dirty ? 0 : -1} onClick={() => { setSaved(d); toast('Settings saved') }}>Save changes</button>
      </div>

      <Dialog open={del} onClose={() => { setDel(false); setTyped('') }} tone="danger" title={`Delete ${project.name}?`}
        sub={<>Type <b>{project.name}</b> to confirm. Every event, report and chat goes with it.</>}
        footer={<><button className="btn" onClick={() => { setDel(false); setTyped('') }}>Cancel</button>
          <button className="btn btn-danger-solid" disabled={typed !== project.name} onClick={() => { setDel(false); setTyped(''); toast('The prototype keeps the project, but this is where it would go') }}>Delete project</button></>}>
        <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={project.name} aria-label="Project name" />
      </Dialog>
    </div>
  )
}
