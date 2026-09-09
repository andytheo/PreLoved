'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, MapPin, X } from 'lucide-react'

type ItemRequest = {
  id: string
  status: string
  message: string | null
  createdAt: string
  requester: {
    id: string
    name: string
    image: string | null
    city: string | null
    createdAt: string
  }
}

type Payload = {
  listing: { id: string; title: string; status: string }
  requests: ItemRequest[]
}

export default function ListingRequestsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    const response = await fetch(`/api/listings/${params.id}/requests`, { cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'Unable to load requests')
    setData(json)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [params.id])

  const act = async (requestId: string, action: 'accept' | 'decline' | 'complete') => {
    setBusyId(requestId)
    setError('')
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to update request')
      await load()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update request')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/listings/${params.id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to listing
      </Link>

      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Giver Dashboard</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">Item Requests</h1>
          {data && <p className="text-sm text-gray-500 mt-1">{data.listing.title}</p>}
        </div>
        {data && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-3 py-1.5 text-gray-600">{data.listing.status}</span>
        )}
      </div>

      {error && <div className="mb-5 border border-red-200 bg-red-50 text-red-700 p-4 text-sm">{error}</div>}

      {!data ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : data.requests.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="font-bold text-gray-700">No requests yet</p>
          <p className="text-sm text-gray-500 mt-1">When someone requests this item, they’ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.requests.map((request) => (
            <div key={request.id} className={`bg-white border p-5 ${request.status === 'ACCEPTED' ? 'border-green-300' : 'border-gray-200'}`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {request.requester.image ? (
                    <img src={request.requester.image} alt={request.requester.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-teal-700">{request.requester.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/profile/${request.requester.id}`} className="font-bold text-gray-900 hover:underline">{request.requester.name}</Link>
                      {request.requester.city && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{request.requester.city}</p>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.message && <p className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 p-3 whitespace-pre-line">{request.message}</p>}

                  {request.status === 'PENDING' && data.listing.status === 'AVAILABLE' && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => act(request.id, 'accept')} disabled={busyId !== null} className="flex-1 bg-black text-white py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
                        {busyId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                      </button>
                      <button onClick={() => act(request.id, 'decline')} disabled={busyId !== null} className="flex-1 border border-gray-300 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40">
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  )}

                  {request.status === 'ACCEPTED' && (
                    <button onClick={() => act(request.id, 'complete')} disabled={busyId !== null} className="mt-4 w-full bg-green-700 hover:bg-green-800 text-white py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40">
                      {busyId === request.id ? 'Saving...' : 'Mark Handoff Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
