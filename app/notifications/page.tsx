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

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || 'Unable to load notifications')
        if (active) setItems(json.notifications)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load notifications')
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const markAllRead = async () => {
    setBusy(true)
    setError('')
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Account</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">Notifications</h1>
        </div>
        <button onClick={markAllRead} disabled={busy || !items?.some((item) => !item.readAt)} className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-black disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Mark all read
        </button>
      </div>

      {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!items ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-300 px-4 py-16 text-center text-gray-500">
          <Bell className="mx-auto mb-3 h-6 w-6" />
          <p className="text-sm">You don’t have any notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 bg-white">
          {items.map((item) => {
            const content = (
              <div className={`p-4 sm:p-5 ${item.readAt ? 'bg-white' : 'bg-teal-50/50'}`}>
                <div className="flex gap-3">
                  <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${item.readAt ? 'bg-gray-200' : 'bg-[#0BA8A4]'}`} />
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-1 break-words text-sm text-gray-600">{item.body}</p>
                    <p className="mt-2 text-[11px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )

            return item.href ? (
              <Link key={item.id} href={item.href} className="block hover:bg-gray-50">{content}</Link>
            ) : (
              <div key={item.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
