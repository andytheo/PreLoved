'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const response = await fetch('/api/notifications', { cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'Unable to load notifications')
    setItems(json.notifications)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  const markAllRead = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!response.ok) throw new Error('Unable to update notifications')
      setItems((current) => current?.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })) ?? current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update notifications')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Account</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">Notifications</h1>
        </div>
        <button onClick={markAllRead} disabled={busy || !items?.some((item) => !item.readAt)} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark all read
        </button>
      </div>

      {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!items ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-300 py-16 text-center text-gray-500">
          <Bell className="w-6 h-6 mx-auto mb-3" />
          <p className="text-sm">You don’t have any notifications yet.</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {items.map((item) => {
            const content = (
              <div className={`p-4 sm:p-5 ${item.readAt ? 'bg-white' : 'bg-teal-50/50'}`}>
                <div className="flex gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.readAt ? 'bg-gray-200' : 'bg-[#0BA8A4]'}`} />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )

            return item.href ? <Link key={item.id} href={item.href} className="block hover:bg-gray-50">{content}</Link> : <div key={item.id}>{content}</div>
          })}
        </div>
      )}
    </div>
  )
}
