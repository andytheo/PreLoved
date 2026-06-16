import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ListingCard from '@/components/listings/ListingCard'
import { ListingWithUser } from '@/types'
import { MapPin, Calendar, Package, User } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      city: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  })

  if (!user) notFound()

  const listings = await prisma.listing.findMany({
    where: { userId: id },
    include: {
      user: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const availableCount = listings.filter((l) => l.isAvailable).length
  const givenAwayCount = listings.filter((l) => !l.isAvailable).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-teal-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
            {user.bio && <p className="text-gray-600 text-sm mb-3">{user.bio}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{listings.length}</div>
            <div className="text-xs text-gray-500">Total posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-teal-600">{availableCount}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-400">{givenAwayCount}</div>
            <div className="text-xs text-gray-500">Given away</div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-teal-600" />
        Items by {user.name}
      </h2>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500">No items posted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing as ListingWithUser} />
          ))}
        </div>
      )}
    </div>
  )
}
