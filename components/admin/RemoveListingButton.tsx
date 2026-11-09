'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleRemove = async () => {
    if (!window.confirm('Remove this listing? This cannot be undone.')) return

    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to remove listing')
        return
      }
      router.refresh()
    } catch {
      setError('Failed to remove listing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className="rounded-full border border-red-500/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {busy ? 'Removing...' : 'Remove'}
      </button>
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
    </div>
  )
}
