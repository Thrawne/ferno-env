import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TextMorph } from 'torph/react'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleDashed, Loader2, Menu, ShieldCheck, X } from 'lucide-react'
import { FernoMark, useApp } from '../components/ui'
import { CopyButton } from '../components/overlay'
import './landing.css'

/**
 * The marketing page (#/landing). Copy is useferno.com's, word for word; the
 * design is the app's: Manrope heads, the amber ground with the white glitch
 * squares, white cards with the soft left-falling shadow.
 *
 * Each product shot plays once, when it scrolls into view, and stops on its
 * payoff (the answer, the finished checks, the approval). Under reduced motion
 * they render that payoff straight away.
 */

const INSTALL = 'npm install @fernohq/analytics-next'
// Figma 241:35540: the glitch squares' white alpha, row by row
const GLITCH = [0, .2, .4, .2, .8, .2, .4, .7, .8, 0, .8, 0, 0, .8, .2, 0, .8, .4, 0, .7, .8, .7, .2, .4, .4]

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has been at least `amount` in view; never goes back. */
function useSeen<T extends HTMLElement>(amount = 0.35) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (reduced() || typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: amount })
    io.observe(el)
    return () => io.disconnect()
  }, [seen, amount])
  return [ref, seen] as const
}

/** Steps 0…n on a schedule (ms from start) once `go` turns true; the last step under reduced motion. */
function useBeats(go: boolean, at: number[]) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!go) return
    if (reduced()) { setN(at.length); return }
    const ts = at.map((ms, i) => setTimeout(() => setN(i + 1), ms))
    return () => ts.forEach(clearTimeout)
  }, [go]) // eslint-disable-line
  return n
}

function Glitch({ className = '' }: { className?: string }) {
  return <div className={'ld-glitch ' + className} aria-hidden>{GLITCH.map((a, i) => <i key={i} style={{ background: `rgba(255,255,255,${a})` }} />)}</div>
}

function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return <p className="ld-eyebrow"><span className="mono">{n}</span><span>/</span>{children}</p>
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })

/* ───────── Page ───────── */
export function Landing() {
  const { go } = useApp()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const on = () => setScrolled(el.scrollTop > 8)
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [])
  const nav = (id: string) => { setMenu(false); scrollTo(id) }
  const start = () => go('signin')

  const LINKS: [string, string][] = [['How it works', 'how-it-works'], ['What you get', 'what-you-get'], ['SDK', 'sdk']]

  return (
    <div className="ld" ref={root}>
      <header className={'ld-nav' + (scrolled ? ' scrolled' : '') + (menu ? ' open' : '')}>
        <div className="ld-nav-in">
          <button className="ld-logo" onClick={() => root.current?.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' })} aria-label="ferno, back to top">
            <FernoMark size={22} /><span>ferno</span>
          </button>
          <nav className="ld-links" aria-label="Sections">
            {LINKS.map(([l, id]) => <button key={id} onClick={() => nav(id)}>{l}</button>)}
            <button onClick={() => go('docs')}>Docs<ArrowUpRight size={13} /></button>
          </nav>
          <div className="ld-nav-cta">
            <button className="ld-btn ghost" onClick={() => go('signin')}>Sign in</button>
            <button className="ld-btn dark" onClick={start}>Get started</button>
            <button className="ld-burger" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        <div className="ld-sheet" hidden={!menu}>
          {LINKS.map(([l, id]) => <button key={id} onClick={() => nav(id)}>{l}</button>)}
          <button onClick={() => go('docs')}>Docs<ArrowUpRight size={14} /></button>
          <button onClick={() => go('signin')}>Sign in</button>
        </div>
      </header>

      <main>
        {/* ───── Hero ───── */}
        <section className="ld-hero ld-wrap">
          <div className="ld-hero-copy">
            <h1 className="ld-h1">Product analytics that tells you why metrics moved.</h1>
            <div className="ld-hero-side">
              <p className="ld-lede">Ferno watches your product events, flags the numbers that changed, and shows you the cause with the evidence behind it.</p>
              <div className="ld-ctas">
                <button className="ld-btn dark lg" onClick={start}>Get started<ArrowRight size={16} /></button>
                <button className="ld-btn lg" onClick={() => go('docs')}>Read the docs</button>
              </div>
              <div className="ld-install">
                <code className="mono"><span className="ld-prompt">$</span> {INSTALL}</code>
                <CopyButton text={INSTALL} label="Copy install command" compact />
              </div>
            </div>
          </div>
          <HeroShot />
        </section>

        {/* ───── 01 ───── */}
        <section className="ld-sec ld-wrap" aria-labelledby="q-h">
          <Eyebrow n="01">The questions behind the change</Eyebrow>
          <h2 id="q-h" className="ld-h2">The graph moved.<br /><span className="ld-dim">The questions start there.</span></h2>
          <Questions />
        </section>

        {/* ───── 02 ───── */}
        <section id="how-it-works" className="ld-sec ld-wrap ld-split" aria-labelledby="inv-h">
          <div className="ld-split-copy">
            <Eyebrow n="02">One investigation</Eyebrow>
            <h2 id="inv-h" className="ld-h2">From change<br />to cause.</h2>
            <p className="ld-body">A signal arrives. Ferno compares the baseline, tests the strongest explanations, and keeps the evidence attached.</p>
          </div>
          <Investigation />
        </section>

        {/* ───── 03 ───── */}
        <section id="what-you-get" className="ld-sec ld-wrap ld-split flip" aria-labelledby="hand-h">
          <div className="ld-split-copy">
            <Eyebrow n="03">The handoff</Eyebrow>
            <h2 id="hand-h" className="ld-h2">Bring an answer<br />to the room.</h2>
            <p className="ld-body">A recommended next move, with the evidence and the open questions attached.</p>
            <button className="ld-btn dark lg" onClick={start}>Create workspace<ArrowRight size={16} /></button>
          </div>
          <Handoff />
        </section>

        {/* ───── 04 ───── */}
        <section id="sdk" className="ld-sec ld-wrap ld-split" aria-labelledby="sdk-h">
          <div className="ld-split-copy">
            <Eyebrow n="04">Connect the product</Eyebrow>
            <h2 id="sdk-h" className="ld-h2">Start with the events you already send.</h2>
            <p className="ld-body">Ferno’s browser and Node SDKs take <Calls />. Keep the event names your team already understands.</p>
            <button className="ld-btn lg" onClick={() => go('docs')}>See the docs<ArrowUpRight size={15} /></button>
          </div>
          <Sdk />
        </section>

        {/* ───── 05 ───── */}
        <section id="faq" className="ld-sec ld-wrap ld-faq" aria-labelledby="faq-h">
          <div className="ld-split-copy">
            <Eyebrow n="05">Questions</Eyebrow>
            <h2 id="faq-h" className="ld-h2">Before you connect anything.</h2>
          </div>
          <Faq onSecurity={() => go('docs')} />
        </section>

        {/* ───── Closing ───── */}
        <section className="ld-wrap">
          <div className="ld-close">
            <Glitch className="ld-close-glitch" />
            <h2 className="ld-h2">Product analytics that tells you why metrics moved.</h2>
            <div className="ld-ctas">
              <button className="ld-btn light lg" onClick={start}>Create workspace<ArrowRight size={16} /></button>
              <button className="ld-btn on-amber lg" onClick={() => go('signin')}>Sign in</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="ld-foot ld-wrap">
        <div className="ld-logo static"><FernoMark size={20} /><span>ferno</span></div>
        <nav aria-label="Footer">
          <div>
            <p>Product</p>
            {LINKS.map(([l, id]) => <button key={id} onClick={() => scrollTo(id)}>{l}</button>)}
          </div>
          <div>
            <p>Resources</p>
            <button onClick={() => go('docs')}>Documentation</button>
            <button onClick={() => scrollTo('faq')}>Questions</button>
          </div>
          <div>
            <p>Company</p>
            <button onClick={() => go('docs')}>Security</button>
            <button onClick={() => go('docs')}>Privacy</button>
            <button onClick={() => go('docs')}>Terms</button>
          </div>
          <div>
            <p>Account</p>
            <button onClick={start}>Create workspace</button>
            <button onClick={() => go('signin')}>Sign in</button>
          </div>
        </nav>
      </footer>
    </div>
  )
}

function Calls() {
  const c = ['track', 'identify', 'page', 'screen', 'group', 'alias']
  return <>{c.map((x, i) => <span key={x}><code className="ld-inline mono">{x}</code>{i < c.length - 2 ? ', ' : i === c.length - 2 ? ', and ' : ''}</span>)} calls</>
}

/* ───────── Hero shot: a signal, the question, the cause and its evidence ───────── */
const SIGNALS = [
  { name: 'Sign-ups', ch: '−18%', when: '2h ago', down: true },
  { name: 'Purchases', ch: '+9%', when: 'Yesterday', down: false },
  { name: 'Paid upgrades', ch: '−6%', when: 'Monday', down: true },
]
const EVIDENCE = [
  { t: 'Tuesday’s update', d: 'The drop began within an hour of Tuesday’s update.', v: 'Supports' },
  { t: 'Sign-ups on iPhone and web stayed normal.', v: 'Supports' },
  { t: 'Ad traffic held steady, so fewer visitors isn’t the reason.', v: 'Not the cause' },
]

function HeroShot() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.25)
  // select the signal · ask · think · answer · three pieces of evidence · the fix
  const b = useBeats(seen, [500, 1200, 1900, 3100, 3600, 4100, 4700])
  return (
    <div className="ld-stage" ref={ref}>
      <Glitch />
      <div className="ld-win" aria-label="Ferno, showing why sign-ups dropped (sample data)" role="img">
        <div className="ld-win-bar">
          <span className="ld-win-ws"><span className="ld-ws-tile" />Acme</span>
          <span className="ld-win-tab on">Overview</span>
          <span className="ld-win-tab">Heatmaps</span>
          <span className="ld-chip-soft">Sample data</span>
        </div>
        <div className="ld-win-body">
          <aside className="ld-signals">
            <p className="ld-cap">Signals</p>
            {SIGNALS.map((s, i) => (
              <div key={s.name} className={'ld-sig' + (i === 0 && b >= 1 ? ' on' : '')}>
                <span className="ld-sig-n">{s.name}</span>
                <span className={'ld-sig-c num ' + (s.down ? 'down' : 'up')}>{s.ch}</span>
                <span className="ld-sig-w">{s.when}</span>
              </div>
            ))}
          </aside>
          <div className="ld-thread">
            <div className={'ld-ask' + (b >= 2 ? ' in' : '')}>Why did fewer people finish signing up this week?</div>
            <div className={'ld-think' + (b >= 3 && b < 4 ? ' in' : '')}><FernoMark size={14} animate />Checking device, app_version, signup_source…</div>
            <div className={'ld-cause' + (b >= 4 ? ' in' : '')}>
              <div className="ld-cause-h"><span className="ld-cap accent">Likely cause</span><span className="ld-conf"><i />High confidence</span></div>
              <p className="ld-cause-t">Tuesday’s update broke the Continue button on the Android sign-up form.</p>
              <ul className="ld-ev">
                {EVIDENCE.map((e, i) => (
                  <li key={i} className={b >= 5 + i ? 'in' : ''}>
                    <span className="ld-ev-t">{e.d ? <><b>{e.t}</b>{e.d}</> : e.t}</span>
                    <span className={'ld-tag ' + (e.v === 'Supports' ? 'ok' : 'no')}>{e.v}</span>
                  </li>
                ))}
              </ul>
              <div className={'ld-fix' + (b >= 7 ? ' in' : '')}>
                <span><span className="ld-dim">Suggested fix:</span> Roll back the sign-up form change</span>
                <span className="ld-checked"><span className="ld-dim">Checked</span>{['device', 'app_version', 'signup_source'].map((x) => <code key={x} className="mono">{x}</code>)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────── 01: four questions, each with its own small picture ───────── */
function Questions() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.3)
  return (
    <div className={'ld-qs' + (seen ? ' seen' : '')} ref={ref}>
      <div className="ld-q">
        <div className="ld-q-art">
          <svg viewBox="0 0 220 96" className="ld-spark" aria-hidden>
            <path className="ld-spark-l" d="M4 44 C 30 40, 46 34, 66 38 S 104 30, 124 36 S 146 40, 152 42 C 162 60, 170 72, 186 74 S 208 72, 216 70" />
            <circle cx="216" cy="70" r="4" className="ld-spark-d" />
          </svg>
          <span className="ld-pill down num">−18%</span>
        </div>
        <h3>What changed?</h3>
      </div>
      <div className="ld-q">
        <div className="ld-q-art ld-who">
          {[['Android', 34], ['iPhone', 86], ['Web', 82]].map(([l, w], i) => (
            <div key={l} className="ld-who-r"><span>{l}</span><i><b style={{ width: w + '%', transitionDelay: i * 90 + 'ms' }} className={i === 0 ? 'hit' : ''} /></i></div>
          ))}
        </div>
        <h3>Who felt it?</h3>
      </div>
      <div className="ld-q">
        <div className="ld-q-art">
          <svg viewBox="0 0 220 96" className="ld-band" aria-hidden>
            <rect x="0" y="22" width="220" height="30" rx="4" className="ld-band-r" />
            <path className="ld-band-l" d="M4 38 L 30 34 L 56 41 L 82 35 L 108 39 L 134 33 L 160 40 L 186 37" />
            <path className="ld-band-j" d="M186 37 L 212 80" />
            <circle cx="212" cy="80" r="4" className="ld-spark-d" />
          </svg>
          <span className="ld-pill num mono">outside normal range</span>
        </div>
        <h3>Is it real?</h3>
      </div>
      <div className="ld-q">
        <div className="ld-q-art ld-next">
          <span className="ld-next-row"><CircleDashed size={14} />Roll back the sign-up form change</span>
          <span className="ld-next-btn"><Check size={13} strokeWidth={2.5} />Approve</span>
        </div>
        <h3>What happens next?</h3>
      </div>
    </div>
  )
}

/* ───────── 02: the investigation, checks ticking through ───────── */
const STEPS = ['Did it really change?', 'Who and where?', 'What else explains it?', 'What should happen next?']
function Investigation() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.35)
  // step 1 done · step 2 done · step 3 checking · findings one by one
  const b = useBeats(seen, [300, 1100, 1900, 2600, 3200, 3800, 4400])
  const status = (i: number) => {
    const done = i === 0 ? b >= 2 : i === 1 ? b >= 3 : false
    const active = i === 0 ? b === 1 : i === 1 ? b === 2 : i === 2 ? b >= 3 : false
    return done ? 'Done' : active ? 'Checking now' : 'Up next'
  }
  const F = [
    { k: 'Holds', t: 'The change is concentrated in new browser projects.' },
    { k: 'Doesn’t hold', t: 'The same release is healthy in existing projects.' },
    { k: 'Next check', t: 'The first-event path for new projects.' },
  ]
  return (
    <div className="ld-stage sm" ref={ref}>
      <Glitch />
      <div className="ld-inv">
        <ol className="ld-steps">
          {STEPS.map((s, i) => {
            const st = status(i)
            return (
              <li key={s} data-st={st}>
                <span className="ld-step-i">{st === 'Done' ? <Check size={12} strokeWidth={3} /> : st === 'Checking now' ? <Loader2 size={12} className="spin" /> : <span className="mono">{i + 1}</span>}</span>
                <span className="ld-step-t">{s}</span>
                <span className="ld-step-s"><TextMorph>{st}</TextMorph></span>
              </li>
            )
          })}
        </ol>
        <div className="ld-card ld-inv-card">
          <p className="ld-cap"><span className="ld-live" />Investigation in progress</p>
          <p className="ld-inv-q">Did the release cause the activation drop?</p>
          <div className="ld-by">
            <span className="ld-dim">Broke the change down by</span>
            {['platform', 'version', 'acquisition_source'].map((x, i) => <code key={x} className={'mono' + (b >= 2 + i ? ' in' : '')}>{x}</code>)}
          </div>
          <ul className="ld-find">
            {F.map((f, i) => (
              <li key={f.k} className={b >= 5 + i ? 'in' : ''} data-k={i}>
                <span className="ld-find-k">{f.k}</span><span>{f.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ───────── 03: the recommendation, and the approval it waits for ───────── */
function Handoff() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const [approved, setApproved] = useState(false)
  return (
    <div className="ld-stage sm" ref={ref}>
      <Glitch />
      <div className={'ld-card ld-hand' + (seen ? ' in' : '')}>
        <div className="ld-hand-h"><span className="ld-cap accent">Recommended next move</span><span className="ld-chip-soft">Illustrative</span></div>
        <p className="ld-hand-t">Revert the first-event change for new browser projects.</p>
        <p className="ld-hand-b">Activation for new browser projects dropped right after <code className="mono">v1.8.4</code>. Existing projects on the same release stayed healthy.</p>
        <div className="ld-open"><b>Still open</b>Acquisition mix hasn’t been ruled out yet.</div>
        <div className="ld-hand-f">
          <span className="ld-conf mid"><i />Moderate confidence, with evidence attached</span>
        </div>
        <div className="ld-approve">
          <span className="ld-approve-n"><ShieldCheck size={15} />Nothing runs until someone on your team approves it.</span>
          <button className={'ld-btn ' + (approved ? 'ok' : 'dark')} aria-pressed={approved} onClick={() => setApproved((a) => !a)}>
            {approved ? <Check size={15} strokeWidth={2.5} /> : null}<TextMorph>{approved ? 'Approved' : 'Approve'}</TextMorph>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── 04: the SDK, and an event arriving ───────── */
function Sdk() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const b = useBeats(seen, [1400])
  return (
    <div className="ld-stage sm" ref={ref}>
      <Glitch />
      <div className="ld-card ld-code">
        <div className="ld-code-h"><span className="mono">analytics.ts</span><span className="ld-chip-soft">TypeScript</span></div>
        <pre className="mono">
          <span className="k">import</span> {'{ '}<span className="t">AnalyticsBrowser</span>{' }'} <span className="k">from</span>{'\n'}
          {'  '}<span className="s">'@fernohq/analytics-next'</span>{'\n\n'}
          <span className="k">const</span> analytics = <span className="t">AnalyticsBrowser</span>.<span className="f">load</span>({'{'}{'\n'}
          {'  '}writeKey: <span className="s">'ferno_pk_••••••'</span>{'\n'}
          {'}'}){'\n\n'}
          analytics.<span className="f">track</span>(<span className={'s' + (b >= 1 ? ' ld-sent' : '')}>'checkout_started'</span>)
        </pre>
        <div className="ld-listen">
          <span className="ld-live" /><TextMorph>{b >= 1 ? 'checkout_started received' : 'Listening for change'}</TextMorph>
        </div>
      </div>
    </div>
  )
}

/* ───────── 05: questions ───────── */
const QA: { q: string; a: string; link?: string }[] = [
  { q: 'Do we have to rewrite our tracking?', a: 'No. Ferno’s browser and Node SDKs are built on Segment’s open-source analytics library, so track, identify, page, screen, group, and alias work the way your team already writes them. Point them at your Ferno project key and keep your event names.' },
  { q: 'What does Ferno watch for?', a: 'Ferno compares each project’s most recent 24 hours of events with the previous 24 hours. When something moves enough to matter, it opens an investigation instead of just raising an alert.' },
  { q: 'How can we verify Ferno’s answer?', a: 'Every report states its confidence, shows the queries Ferno ran and what they returned, and lists what it couldn’t rule out. Your team can check the reasoning instead of taking it on trust.' },
  { q: 'Can Ferno change things on its own?', a: 'No. Investigations are read-only. Ferno recommends a next move, and anything that touches a connected tool, like your Linear workspace, needs someone on your team to approve it first.' },
  { q: 'How is our data kept separate?', a: 'Every API key belongs to one workspace and project, and Ferno decides where events go from the key itself. Keys are stored as a one-way digest, and connected integration credentials are encrypted at rest.', link: 'Read the security overview' },
]
function Faq({ onSecurity }: { onSecurity: () => void }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="ld-qa">
      {QA.map((x, i) => {
        const on = open === i
        return (
          <div key={x.q} className="ld-qa-i" data-open={on}>
            <h3>
              <button aria-expanded={on} aria-controls={'qa-' + i} id={'qa-b-' + i} onClick={() => setOpen(on ? -1 : i)}>
                {x.q}<ChevronDown size={18} className="ld-qa-c" />
              </button>
            </h3>
            <div className="ld-qa-a" id={'qa-' + i} role="region" aria-labelledby={'qa-b-' + i} inert={!on}>
              <div>
                <p>{x.a}</p>
                {x.link && <button className="ld-link" onClick={onSecurity}>{x.link}<ArrowRight size={14} /></button>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
