'use client'

import { useState } from 'react'
import { Ban, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function BlockUserButton({
  userId,
  initialBlocked = false,
}: {
  userId: string
  initialBlocked?: boolean
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (session?.user?.id === userId) return null

  const toggle = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    const next = !blocked
    if (next && !window.confirm('Block this member? They will no longer be able to request your items, and you will not be able to request theirs.')) return

    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/blocks', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to update block')
      setBlocked(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update block')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={toggle} disabled={busy} className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider border disabled:opacity-40 ${blocked ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
        {blocked ? 'Unblock Member' : 'Block Member'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
