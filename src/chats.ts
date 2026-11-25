import { useSyncExternalStore } from 'react'
import type { ThumbKind } from './components/RecentThumb'

/**
 * Agent chat history: every conversation, newest first. A tiny store
 * (useSyncExternalStore) so the Agent home, the history page and the chat all
 * see renames and deletes at once. Seeded threads are already answered, so
 * opening one shows the settled answer instead of replaying it.
 */
export type Msg = { id: number; q: string; time: string; settled?: boolean }
export type Thread = { id: string; title: string; when: string; sub: string; msgs: Msg[]; thumb: ThumbKind }

const seed = (id: string, title: string, when: string, sub: string, q: string, thumb: ThumbKind, n: number): Thread =>
  ({ id, title, when, sub, thumb, msgs: [{ id: n, q, time: '09:12', settled: true }] })

let threads: Thread[] = [
  seed('c-changed', 'What changed recently', '2h ago', 'Found 2 causes · linked to a report', 'What changed in my product recently?', 'traffic', 1),
  seed('c-export', 'Export funnel drop', '5h ago', 'Found 2 causes · linked to a report', 'Show me the rage clicks on Export', 'rage', 2),
  seed('c-pricing', 'Pricing page spike', 'Yesterday', 'Found 1 cause · linked to a report', 'What is driving the pricing page increase?', 'pricing', 3),
  seed('c-signups', 'Sign-up dip after Nov 19', 'Nov 20', 'Found 1 cause · linked to a report', 'Why did sign-ups dip after the Nov 19 release?', 'traffic', 4),
  seed('c-onboarding', 'Onboarding vs adoption', 'Nov 17', 'Compared 8 weekly cohorts', 'Compare onboarding and feature adoption', 'pricing', 5),
]
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export function useThreads() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => threads)
}
export const getThread = (id: string) => threads.find((t) => t.id === id)

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const titleFrom = (q: string) => { const t = q.replace(/\?$/, ''); return t.length > 42 ? t.slice(0, 40).trimEnd() + '…' : t }

/** Starts a thread with its first question; returns its id. */
export function newThread(q: string): string {
  const id = 'c-' + Date.now().toString(36)
  threads = [{ id, title: titleFrom(q), when: 'Just now', sub: 'In progress', thumb: 'traffic', msgs: [{ id: Date.now(), q, time: now() }] }, ...threads]
  emit()
  return id
}
export function ask(id: string, q: string) {
  threads = threads.map((t) => (t.id === id ? { ...t, when: 'Just now', msgs: [...t.msgs, { id: Date.now(), q, time: now() }] } : t))
  // the active thread moves to the top
  const t = threads.find((x) => x.id === id)
  if (t) threads = [t, ...threads.filter((x) => x.id !== id)]
  emit()
}
export function rename(id: string, title: string) {
  threads = threads.map((t) => (t.id === id ? { ...t, title: title.trim() || t.title } : t))
  emit()
}
/** Removes a thread; returns a function that puts it back where it was (for Undo). */
export function remove(id: string): () => void {
  const i = threads.findIndex((t) => t.id === id)
  const gone = threads[i]
  threads = threads.filter((t) => t.id !== id)
  emit()
  return () => { if (!gone) return; const next = [...threads]; next.splice(i, 0, gone); threads = next; emit() }
}
