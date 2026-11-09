'use client'

import { useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const REASONS = [
  ['scam', 'Scam or money request'],
  ['prohibited_item', 'Prohibited or unsafe item'],
  ['inappropriate', 'Inappropriate content'],
  ['spam', 'Spam or commercial listing'],
  ['unsafe', 'Unsafe behaviour or pickup'],
  ['other', 'Other'],
] as const

export default function ReportListingButton({ listingId }: { listingId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>('scam')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const start = () => {
    if (!session) {
      router.push('/login')
      return
    }
    setOpen(true)
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, reason, details: details.trim() || undefined }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to submit report')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit report')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button onClick={start} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
        <Flag className="w-3.5 h-3.5" /> Report listing
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Report listing">
          <div className="bg-white w-full max-w-md border border-gray-200 shadow-2xl p-6 relative">
            <button onClick={() => setOpen(false)} aria-label="Close report dialog" className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>

            {sent ? (
              <div className="py-8 text-center">
                <Flag className="w-7 h-7 mx-auto text-[#0BA8A4] mb-3" />
                <h2 className="font-black uppercase tracking-tight">Report received</h2>
                <p className="text-sm text-gray-500 mt-2">Thanks. The report is queued for review.</p>
                <button onClick={() => setOpen(false)} className="mt-5 bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider">Close</button>
              </div>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Safety</p>
                <h2 className="text-xl font-black uppercase tracking-tight mb-5">Report listing</h2>

                {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="w-full border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black mb-4">
                  {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>

                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">Details (optional)</label>
                <textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 1000))} rows={4} className="w-full border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black resize-none" placeholder="Tell us what happened." />

                <button onClick={submit} disabled={busy} className="mt-4 w-full bg-black text-white py-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Submit report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
