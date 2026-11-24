import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { useApp } from '../components/ui'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 500 }}>
      <svg width="24" height="18" viewBox="0 0 24 18" aria-hidden>
        <path d="M2 14 L7 4 L12 11 L17 4 L22 14" fill="none" stroke="#181818" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="2" y="15.5" width="7" height="2.5" fill="#d97706" rx="1" />
      </svg>
      Ferno
    </div>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

/** The grid of pixel squares behind the hero: grey on the left, warming to amber bottom-right. */
function PixelField() {
  const cols = 32, rows = 40
  const cells = useMemo(() => Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols)
    const s = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
    const warm = (c / cols) * 0.6 + (r / rows) * 0.7 - 0.55
    const show = s < 0.42
    const amber = warm > 0 && s < warm * 1.2
    const shade = amber ? ['#fde5d0', '#fbd3b0', '#f7bd8b', '#f2a66a'][Math.min(3, Math.floor(warm * 6 * s * 3))] : ['#efefef', '#e9e9e9', '#e4e4e4'][Math.floor(s * 7) % 3]
    return { show, shade, d: (c + r) * 18 + s * 600 }
  }), [])
  return (
    <div aria-hidden style={{ position: 'absolute', inset: -2, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
      {cells.map((c, i) => (
        <i key={i} style={{ aspectRatio: '1', borderRadius: 2, background: c.show ? c.shade : 'transparent', animation: c.show ? `px-in .6s cubic-bezier(.23,1,.32,1) ${c.d}ms both` : undefined, ['--o' as string]: 1 }} />
      ))}
    </div>
  )
}

export function SignIn() {
  const { go } = useApp()
  const [busy, setBusy] = useState(false)
  return (
    <div className="signin fade-page">
      <div className="signin-left">
        <Logo />
        <div style={{ margin: 'auto 0', maxWidth: 400 }}>
          <div style={{ color: 'var(--accent-600)' }}>Welcome</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 40, lineHeight: '48px', letterSpacing: '-0.03em', margin: '8px 0 12px' }}>Sign in to Ferno.</h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: '24px', margin: '0 0 24px' }}>New here? We set up your workspace right after you sign in.</p>
          <button className="g-btn" disabled={busy} onClick={() => { setBusy(true); setTimeout(() => go('overview'), 900) }}>
            {busy ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleG />}
            {busy ? 'Signing you in…' : 'Continue with Google'}
          </button>
          <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: '16px', marginTop: 24 }}>Use your work Google account. Ferno only reads the product data you connect.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
          <span>© 2026 Ferno</span>
          <span style={{ display: 'flex', gap: 16 }}><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></span>
        </div>
      </div>
      <div className="signin-right">
        <PixelField />
        <div style={{ position: 'relative', padding: '96px 64px 0' }}>
          <div style={{ color: 'var(--accent-600)', letterSpacing: '.08em', fontSize: 13 }}>PRODUCT INTELLIGENCE</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 40, lineHeight: '46px', letterSpacing: '-0.03em', margin: '8px 0 12px', maxWidth: 420, background: 'rgba(247,247,247,.7)' }}>Find the signal in your product.</h2>
          <p style={{ color: 'var(--muted)', fontSize: 17, margin: 0, background: 'rgba(247,247,247,.7)', display: 'inline-block' }}>A calmer way to understand what changed, and why.</p>
        </div>
        <div className="float-card" style={{ left: '14%', top: '47%', width: 350 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--accent-600)', letterSpacing: '.08em' }}>FERNO NOTICED</span><span style={{ color: 'var(--muted)' }}>2m ago</span>
          </div>
          <div style={{ margin: '12px 0 16px', fontSize: 15, lineHeight: '22px' }}>Sign-ups dipped 2.1% after Tuesday’s release.</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 44 }}>
            {[34, 38, 36, 42, 40, 26, 26].map((h, i) => (
              <span key={i} style={{ flex: 1, height: h, borderRadius: 4, background: i > 4 ? '#e5322d' : ['#f3d1a8', '#efc495', '#ecbb84', '#e9ad6d', '#e5a35c'][i], transformOrigin: 'bottom', animation: `bar-grow .7s cubic-bezier(.23,1,.32,1) ${400 + i * 60}ms both` }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            <span className="pill down"><ArrowDown size={11} />2.1%</span>Safari · Google sign-in step
          </div>
        </div>
        <div className="float-card" style={{ left: '56%', top: '74%', padding: '14px 16px', animationDelay: '-3s' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Weekly active</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 500 }} className="num">3,904</span><span className="pill up"><ArrowUp size={11} />6.1%</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes bar-grow { from { transform: scaleY(0); } }`}</style>
    </div>
  )
}
