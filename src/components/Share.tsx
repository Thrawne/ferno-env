import { useCallback, useRef, useState } from 'react'
import { Globe, Lock, Share2 } from 'lucide-react'
import { Popover } from './ui'
import { CopyButton, Switch, toast } from './overlay'

/**
 * Share a report or chat by link. Workspace members can always open it;
 * the switch adds a read-only public link (the prototype doesn't serve it).
 */
export function ShareButton({ what, path }: { what: 'report' | 'chat'; path: string }) {
  const [open, setOpen] = useState(false)
  const [pub, setPub] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const link = `${location.origin}/#/${path}`
  return (
    <div className="select-wrap" ref={ref}>
      <button className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}><Share2 size={14} />Share</button>
      <Popover anchor={ref} open={open} onClose={close} align="end" matchWidth={false} minWidth={320} label={`Share ${what}`}>
        <div className="share">
          <div className="share-t">Share this {what}</div>
          <div className="share-row">
            <span className="share-ico">{pub ? <Globe size={15} /> : <Lock size={15} />}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="share-l">{pub ? 'Anyone with the link' : 'Workspace members only'}</span>
              <span className="share-s">{pub ? 'Read-only. No sign-in needed.' : 'People in Ennead can open it.'}</span>
            </span>
            <Switch on={pub} label="Public link" onChange={(v) => { setPub(v); toast(v ? 'Public link on' : 'Public link off') }} />
          </div>
          <div className="share-link">
            <input readOnly value={link} className="mono" aria-label="Link" onFocus={(e) => e.target.select()} />
            <CopyButton text={link} label="Copy link" />
          </div>
        </div>
      </Popover>
    </div>
  )
}
