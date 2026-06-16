'use client'

import Link from 'next/link'
import { MapPin, Heart } from 'lucide-react'
import { ListingWithUser } from '@/types'
import { formatTimeAgo, parseImagesWithCredits, truncate } from '@/lib/utils'
import { getCategoryById, getConditionById } from '@/lib/categories'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ListingCardProps {
  listing: ListingWithUser
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void
}

export default function ListingCard({ listing, onFavoriteToggle }: ListingCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [favorited, setFavorited] = useState(listing.isFavorited ?? false)
  const [favCount, setFavCount] = useState(listing._count?.favorites ?? 0)
  const [showCredit, setShowCredit] = useState(false)

  const images = parseImagesWithCredits(listing.images)
  const mainImage = images[0]
  const category = getCategoryById(listing.category)
  const condition = getConditionById(listing.condition)

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push('/login')
      return
    }

    const newFavorited = !favorited
    setFavorited(newFavorited)
    setFavCount((prev) => (newFavorited ? prev + 1 : prev - 1))

    try {
      await fetch('/api/favorites', {
        method: newFavorited ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      onFavoriteToggle?.(listing.id, newFavorited)
    } catch {
      setFavorited(!newFavorited)
      setFavCount((prev) => (newFavorited ? prev - 1 : prev + 1))
    }
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      {/* Image */}
      <div
        className="relative aspect-square bg-gray-100 overflow-hidden"
        onMouseEnter={() => setShowCredit(true)}
        onMouseLeave={() => setShowCredit(false)}
      >
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <span className="text-5xl mb-1.5">{category?.icon ?? '📦'}</span>
            <span className="text-[10px] tracking-widest uppercase text-gray-400 font-medium">No Photo</span>
          </div>
        )}

        {/* FREE badge */}
        <div className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1">
          FREE
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          aria-label={favorited ? 'Remove from saved' : 'Save item'}
          className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center transition-all ${
            favorited
              ? 'bg-black text-white'
              : 'bg-white/80 text-gray-500 hover:bg-white hover:text-black backdrop-blur-sm'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-white' : ''}`} />
        </button>

        {/* Condition */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="bg-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 text-gray-700">
            {condition?.name ?? listing.condition}
          </span>
        </div>

        {/* Multiple images indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5">
            +{images.length - 1}
          </div>
        )}

        {/* Photo credit — appears on hover */}
        {mainImage?.credit && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1.5 transition-opacity duration-200 ${
              showCredit ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="text-[9px] text-white/70 tracking-wide truncate">
              📷{' '}
              {mainImage.creditUrl ? (
                <a
                  href={mainImage.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {mainImage.credit}
                </a>
              ) : (
                mainImage.credit
              )}{' '}
              on Unsplash
            </p>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="pt-3 pb-1">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-gray-400 mb-1">
          {category?.name ?? listing.category}
        </p>
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0BA8A4] transition-colors">
          {truncate(listing.title, 48)}
        </h3>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </span>
          <span className="text-[10px] text-gray-400">{formatTimeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  )
}
