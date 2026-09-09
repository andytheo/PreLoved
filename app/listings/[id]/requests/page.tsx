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

  const refreshData = async () => {
    const response = await fetch(`/api/listings/${params.id}/requests`, { cache: 'no-store' })
    const json = await response.json()
    if (!response.ok) throw new Error(json.error || 'Unable to load requests')
    setData(json)
  }

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const response = await fetch(`/api/listings/${params.id}/requests`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || 'Unable to load requests')
        if (active) setData(json)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load requests')
      }
    })()

    return () => {
      active = false
    }
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
      await refreshData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update request')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={`/listings/${params.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black sm:mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to listing
      </Link>

      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Giver Dashboard</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">Item Requests</h1>
          {data && <p className="mt-1 break-words text-sm text-gray-500">{data.listing.title}</p>}
        </div>
        {data && <span className="w-fit bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">{data.listing.status}</span>}
      </div>

      {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : data.requests.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-16 text-center">
          <p className="font-bold text-gray-700">No requests yet</p>
          <p className="mt-1 text-sm text-gray-500">When someone requests this item, they’ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.requests.map((request) => (
            <div key={request.id} className={`border bg-white p-4 sm:p-5 ${request.status === 'ACCEPTED' ? 'border-green-300' : 'border-gray-200'}`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100">
                  {request.requester.image ? (
                    <img src={request.requester.image} alt={request.requester.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-teal-700">{request.requester.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <div className="min-w-0">
                      <Link href={`/profile/${request.requester.id}`} className="break-words font-bold text-gray-900 hover:underline">{request.requester.name}</Link>
                      {request.requester.city && <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{request.requester.city}</p>}
                    </div>
                    <span className={`w-fit px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {request.status}
                    </span>
                  </div>

                  {request.message && <p className="mt-4 whitespace-pre-line break-words border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">{request.message}</p>}

                  {request.status === 'PENDING' && data.listing.status === 'AVAILABLE' && (
                    <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      <button onClick={() => act(request.id, 'accept')} disabled={busyId !== null} className="flex items-center justify-center gap-2 bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40">
                        {busyId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
                      </button>
                      <button onClick={() => act(request.id, 'decline')} disabled={busyId !== null} className="flex items-center justify-center gap-2 border border-gray-300 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40">
                        <X className="h-4 w-4" /> Decline
                      </button>
                    </div>
                  )}

                  {request.status === 'ACCEPTED' && (
                    <button onClick={() => act(request.id, 'complete')} disabled={busyId !== null} className="mt-4 w-full bg-green-700 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-green-800 disabled:opacity-40">
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
