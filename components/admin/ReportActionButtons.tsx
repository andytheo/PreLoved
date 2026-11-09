'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReportActionButtons({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const updateStatus = async (status: 'RESOLVED' | 'DISMISSED') => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to update report')
        return
      }
      router.refresh()
    } catch {
      setError('Failed to update report')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateStatus('RESOLVED')}
          disabled={busy}
          className="rounded-full border border-emerald-500/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          Resolve
        </button>
        <button
          type="button"
          onClick={() => updateStatus('DISMISSED')}
          disabled={busy}
          className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
      {error && <span role="alert" className="text-xs text-red-300">{error}</span>}
    </div>
  )
}
