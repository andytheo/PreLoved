'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Heart, Loader2 } from 'lucide-react'
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
      email: string
    }
  }
  session: Session | null
}

export default function ContactSellerSection({ listing, session }: ContactSellerSectionProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(listing.isFavorited ?? false)
  const [favCount, setFavCount] = useState(listing._count?.favorites ?? 0)
  const [loading, setLoading] = useState(false)
  const isOwner = session?.user?.id === listing.userId

  const handleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    const newFav = !favorited
    setFavorited(newFav)
    setFavCount((prev) => (newFav ? prev + 1 : prev - 1))

    try {
      await fetch('/api/favorites', {
        method: newFav ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
    } catch {
      setFavorited(!newFav)
      setFavCount((prev) => (newFav ? prev - 1 : prev + 1))
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
      {session ? (
        <a
          href={`mailto:${listing.user.email}?subject=Interested in: ${encodeURIComponent(listing.title)}&body=Hi ${encodeURIComponent(listing.user.name)},%0A%0AI saw your listing for "${encodeURIComponent(listing.title)}" on PreLoved and I'm interested in picking it up. Is it still available?%0A%0AThanks!`}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact Seller
        </a>
      ) : (
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Sign in to Contact
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
    </div>
  )
}
