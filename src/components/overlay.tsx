import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, X } from 'lucide-react'

/**
 * Overlays and small controls shared by the settings-style pages.
 *
 * Dialog and Sheet keep themselves mounted through a short exit (scale/slide
 * out faster than they came in), trap Tab inside, close on Escape or a press
 * on the scrim, and hand focus back to whatever opened them.
 */

function useExit(open: boolean, ms: number) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return }
    if (!mounted) return
    setClosing(true)
    const t = setTimeout(() => { setMounted(false); setClosing(false) }, ms)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line
  return { mounted, closing }
}

function useModal(open: boolean, onClose: () => void, box: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return
    const back = document.activeElement as HTMLElement | null
    const first = box.current?.querySelector<HTMLElement>('[autofocus], input, textarea, select, button:not([data-close])')
    // after the click that opened it has finished, so the button does not take focus back
    const ft = setTimeout(() => first?.focus(), 30)
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab' || !box.current) return
      const f = [...box.current.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'))
      if (!f.length) return
      const a = f[0], z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', key, true)
    return () => { clearTimeout(ft); document.removeEventListener('keydown', key, true); back?.focus?.() }
  }, [open]) // eslint-disable-line
}

export function Dialog({ open, onClose, title, sub, children, footer, width = 440, tone }: {
  open: boolean; onClose: () => void; title: string; sub?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: number; tone?: 'danger'
}) {
  const { mounted, closing } = useExit(open, 120)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()
  useModal(open, onClose, box)
  if (!mounted) return null
  return createPortal(
    <div className={'ov' + (closing ? ' out' : '')} onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} className={'dlg' + (tone ? ' ' + tone : '')} style={{ width }}>
        <div className="dlg-head">
          <div>
            <h2 id={id} className="dlg-title">{title}</h2>
            {sub && <p className="dlg-sub">{sub}</p>}
          </div>
          <button className="dlg-x" aria-label="Close" data-close onClick={onClose}><X size={16} /></button>
        </div>
        {children && <div className="dlg-body">{children}</div>}
        {footer && <div className="dlg-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** A panel from the right edge, for setup steps and details that need room. */
export function Sheet({ open, onClose, title, sub, icon, children, footer }: {
  open: boolean; onClose: () => void; title: string; sub?: ReactNode; icon?: ReactNode; children: ReactNode; footer?: ReactNode
}) {
  const { mounted, closing } = useExit(open, 180)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()
  useModal(open, onClose, box)
  if (!mounted) return null
  return createPortal(
    <div className={'ov ov-sheet' + (closing ? ' out' : '')} onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} className="sheet">
        <div className="sheet-head">
          {icon && <span className="sheet-ico">{icon}</span>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 id={id} className="dlg-title">{title}</h2>
            {sub && <p className="dlg-sub">{sub}</p>}
          </div>
          <button className="dlg-x" aria-label="Close" data-close onClick={onClose}><X size={16} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ───────── Toasts ───────── */
type Toast = { id: number; text: ReactNode; action?: { label: string; run: () => void } }
let toasts: Toast[] = []
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
export function toast(text: ReactNode, action?: Toast['action']) {
  const id = Date.now() + Math.random()
  toasts = [...toasts.slice(-2), { id, text, action }]
  emit()
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit() }, action ? 5000 : 2800)
}
export function Toaster() {
  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => toasts)
  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          <Check size={15} className="toast-ico" />
          <span>{t.text}</span>
          {t.action && <button className="toast-act" onClick={() => { t.action!.run(); toasts = toasts.filter((x) => x.id !== t.id); emit() }}>{t.action.label}</button>}
        </div>
      ))}
    </div>,
    document.body,
  )
}

/* ───────── Controls ───────── */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)}>
      <i />
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-l">{label}</span>
      {children}
      {hint && <span className="field-h">{hint}</span>}
    </label>
  )
}

/** Copies `text`; the icon turns into a check for a moment. */
export function CopyButton({ text, label = 'Copy', compact }: { text: string; label?: string; compact?: boolean }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* the prototype still confirms */ }
    setDone(true)
    setTimeout(() => setDone(false), 1400)
  }
  return (
    <button className={'btn' + (compact ? ' icon-btn' : '')} onClick={copy} aria-label={compact ? label : undefined}>
      <span className="copy-ico" data-done={done}>{done ? <Check size={14} /> : <Copy size={14} />}</span>
      {!compact && (done ? 'Copied' : label)}
    </button>
  )
}

/** Initials on a tinted tile; the tint follows the name, never its position in a list. */
const TINTS = ['var(--accent-100)', '#dbe8fb', '#d6f3e7', '#e4e0fa', '#fbe2ec']
export function Initials({ name, size = 28 }: { name: string; size?: number }) {
  const i = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length
  return <span className="initials" style={{ width: size, height: size, background: TINTS[h], fontSize: size * 0.4 }}>{i}</span>
}
