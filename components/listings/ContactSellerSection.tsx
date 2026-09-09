'use client'

import { useState } from 'react'
import { Heart, Loader2, Send, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'

interface ContactSellerSectionProps {
  listing: {
    id: string
    title: string
    userId: string
    isAvailable: boolean
    status?: string
    isFavorited?: boolean
    _count?: { favorites: number }
  }
  session: Session | null
  currentRequest?: { id: string; status: string } | null
}

export default function ContactSellerSection({ listing, session, currentRequest }: ContactSellerSectionProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(listing.isFavorited ?? false)
  const [favCount, setFavCount] = useState(listing._count?.favorites ?? 0)
  const [loading, setLoading] = useState(false)
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestState, setRequestState] = useState(currentRequest ?? null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isOwner = session?.user?.id === listing.userId

  const handleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    const newFav = !favorited
    setFavorited(newFav)
    setFavCount((prev) => (newFav ? prev + 1 : Math.max(prev - 1, 0)))

    try {
      const response = await fetch('/api/favorites', {
        method: newFav ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (!response.ok) throw new Error('Unable to update saved item')
    } catch {
      setFavorited(!newFav)
      setFavCount((prev) => (newFav ? Math.max(prev - 1, 0) : prev + 1))
    } finally {
      setLoading(false)
    }
  }

  const requestItem = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    setRequestBusy(true)
    setError('')
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, message: message.trim() || undefined }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error || 'Unable to request this item')
        return
      }
      setRequestState({ id: json.id, status: json.status })
      setMessage('')
      router.refresh()
    } catch {
      setError('Unable to request this item. Please try again.')
    } finally {
      setRequestBusy(false)
    }
  }

  const cancelRequest = async () => {
    if (!requestState) return
    setRequestBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/requests/${requestState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error || 'Unable to cancel request')
        return
      }
      setRequestState({ ...requestState, status: 'CANCELLED' })
      router.refresh()
    } catch {
      setError('Unable to cancel request. Please try again.')
    } finally {
      setRequestBusy(false)
    }
  }

  if (isOwner) {
    return (
      <div className="space-y-3">
        <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4">
          This is your listing
        </div>
        <Link
          href={`/listings/${listing.id}/requests`}
          className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Review Requests
        </Link>
      </div>
    )
  }

  const status = requestState?.status
  const canRequest = listing.isAvailable && (!listing.status || listing.status === 'AVAILABLE')

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs">{error}</div>}

      {!session ? (
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 bg-[#0BA8A4] hover:bg-teal-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Sign in to Request Item
        </Link>
      ) : status === 'PENDING' ? (
        <div className="space-y-2">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-3 text-sm text-center font-medium">
            Request pending
          </div>
          <button onClick={cancelRequest} disabled={requestBusy} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Cancel Request
          </button>
        </div>
      ) : status === 'ACCEPTED' ? (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-3 text-sm text-center font-medium">
            Your request was accepted. Pickup details are shown on this page.
          </div>
          <button onClick={cancelRequest} disabled={requestBusy} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Cancel Request
          </button>
        </div>
      ) : status === 'DECLINED' ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-3 text-sm text-center">
          This request was not selected.
        </div>
      ) : status === 'COMPLETED' ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-3 text-sm text-center">
          Handoff completed.
        </div>
      ) : canRequest ? (
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 500))}
            rows={3}
            placeholder="Optional note to the giver (pickup availability, why you need it, etc.)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0BA8A4] resize-none"
          />
          <button onClick={requestItem} disabled={requestBusy} className="w-full flex items-center justify-center gap-2 bg-[#0BA8A4] hover:bg-teal-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            {requestBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Request Item
          </button>
        </div>
      ) : (
        <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-xl">
          This item is not accepting requests
        </div>
      )}

      <button
        onClick={handleFavorite}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors border-2 ${
          favorited
            ? 'bg-red-50 border-red-400 text-red-600 hover:bg-red-100'
            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        )}
        {favorited ? `Saved (${favCount})` : `Save Item (${favCount})`}
      </button>
    </div>
  )
}
