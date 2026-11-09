import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import ListingCard from '@/components/listings/ListingCard'
import BlockUserButton from '@/components/safety/BlockUserButton'
import { ListingWithUser } from '@/types'
import { authOptions } from '@/lib/auth'
import { MapPin, Calendar, Package, BadgeCheck } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      city: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  })

  if (!user) notFound()

  const [listings, existingBlock] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: id },
      include: {
        user: { select: { id: true, name: true, image: true, city: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    session?.user?.id && session.user.id !== id
      ? prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  const availableCount = listings.filter((listing) => listing.status === 'AVAILABLE' && listing.isAvailable).length
  const givenAwayCount = listings.filter((listing) => listing.status === 'GIVEN').length
  const verified = !!user.emailVerifiedAt && !!user.phoneVerifiedAt

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-teal-700">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            {user.bio && <p className="text-gray-600 text-sm mt-1 mb-3">{user.bio}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
              {user.city && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{user.city}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Member since {new Date(user.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}
              </span>
            </div>
            {session?.user?.id !== id && (
              <div className="mt-4">
                <BlockUserButton userId={id} initialBlocked={!!existingBlock} />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center"><div className="text-xl font-bold text-gray-900">{listings.length}</div><div className="text-xs text-gray-500">Total posts</div></div>
          <div className="text-center"><div className="text-xl font-bold text-teal-600">{availableCount}</div><div className="text-xs text-gray-500">Available</div></div>
          <div className="text-center"><div className="text-xl font-bold text-gray-400">{givenAwayCount}</div><div className="text-xs text-gray-500">Given away</div></div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-teal-600" /> Items by {user.name}
      </h2>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-gray-500">No items posted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing as ListingWithUser} />)}
        </div>
      )}
    </div>
  )
}
