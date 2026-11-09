'use client'

import { useState } from 'react'
import { MessageCircle, Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'

interface ContactSellerSectionProps {
  listing: {
    id: string
    title: string
    userId: string
    isAvailable: boolean
    isFavorited?: boolean
    _count?: { favorites: number }
    user: {
      id: string
      name: string
    }
  }
  session: Session | null
}

export default function ContactSellerSection({ listing, session }: ContactSellerSectionProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(listing.isFavorited ?? false)
  const [favCount, setFavCount] = useState(listing._count?.favorites ?? 0)
  const [loading, setLoading] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [error, setError] = useState('')
  const isOwner = session?.user?.id === listing.userId

  const handleMessage = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!session.user.emailVerified) {
      router.push('/verify-email')
      return
    }

    setMessaging(true)
    setError('')
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.id) {
        throw new Error(data?.error || 'Could not start a conversation')
      }
      router.push(`/messages/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a conversation')
      setMessaging(false)
    }
  }

  const handleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!session.user.emailVerified) {
      router.push('/verify-email')
      return
    }

    setLoading(true)
    setError('')
    const newFav = !favorited
    setFavorited(newFav)
    setFavCount((prev) => (newFav ? prev + 1 : prev - 1))

    try {
      const response = await fetch('/api/favorites', {
        method: newFav ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      if (!response.ok) throw new Error('Failed to update saved item')
    } catch {
      setFavorited(!newFav)
      setFavCount((prev) => (newFav ? prev - 1 : prev + 1))
      setError('Could not update your saved items. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isOwner) {
    return (
      <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4">
        This is your listing
      </div>
    )
  }

  if (!listing.isAvailable) {
    return (
      <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-xl">
        This item is no longer available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {session?.user.emailVerified ? (
        <button
          onClick={handleMessage}
          disabled={messaging}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          Message Seller
        </button>
      ) : (
        <Link
          href={session ? '/verify-email' : '/login'}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {session ? 'Verify email to contact' : 'Sign in to Contact'}
        </Link>
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
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
