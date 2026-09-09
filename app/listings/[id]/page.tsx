import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseImages, formatTimeAgo } from '@/lib/utils'
import { getCategoryById, getConditionById } from '@/lib/categories'
import Link from 'next/link'
import { MapPin, Clock, ArrowLeft, Tag, CheckCircle, LockKeyhole } from 'lucide-react'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
import ImageGallery from '@/components/listings/ImageGallery'
import ContactSellerSection from '@/components/listings/ContactSellerSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          bio: true,
          createdAt: true,
        },
      },
      _count: { select: { favorites: true, requests: true } },
    },
  })

  if (!listing) notFound()

  const images = parseImages(listing.images)
  const category = getCategoryById(listing.category)
  const condition = getConditionById(listing.condition)
  const isOwner = session?.user?.id === listing.userId

  const currentRequest = session?.user?.id && !isOwner
    ? await prisma.request.findUnique({
        where: {
          requesterId_listingId: {
            requesterId: session.user.id,
            listingId: listing.id,
          },
        },
        select: { id: true, status: true },
      })
    : null

  const canSeePickup = isOwner || currentRequest?.status === 'ACCEPTED' || currentRequest?.status === 'COMPLETED'

  const moreBySeller = await prisma.listing.findMany({
    where: {
      userId: listing.userId,
      id: { not: id },
      isAvailable: true,
      status: 'AVAILABLE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { user: { select: { id: true, name: true, image: true, city: true } } },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  const statusLabel =
    listing.status === 'RESERVED' ? 'Reserved' : listing.status === 'GIVEN' ? 'Given' : 'Available'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link href="/search" className="inline-flex items-center gap-2 text-gray-500 hover:text-teal-600 mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={images} title={listing.title} />

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${category?.color ?? 'bg-gray-100 text-gray-600'}`}>
                    {category?.icon} {category?.name ?? listing.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {condition?.name ?? listing.condition}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listing.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : listing.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-green-600">FREE</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimeAgo(listing.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {listing._count.favorites} saves
              </span>
            </div>

            {canSeePickup ? (
              <div className="mb-6 border border-teal-200 bg-teal-50 p-4 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">Pickup details</p>
                <p className="text-sm text-teal-900">
                  {listing.address || 'The giver has not added an exact pickup address yet.'}
                </p>
                {listing.lat != null && listing.lng != null && (
                  <p className="text-xs text-teal-700 mt-1">Coordinates: {listing.lat.toFixed(5)}, {listing.lng.toFixed(5)}</p>
                )}
              </div>
            ) : (
              <div className="mb-6 border border-gray-200 bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                <LockKeyhole className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Pickup address protected</p>
                  <p className="text-xs text-gray-500 mt-1">Exact pickup details are only shown to the selected recipient.</p>
                </div>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>

            {isOwner && (
              <div className="grid sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
                <Link href={`/listings/${listing.id}/edit`} className="text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Edit Listing
                </Link>
                <Link href={`/listings/${listing.id}/requests`} className="text-center bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Requests ({listing._count.requests})
                </Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Posted by</h3>
            <Link href={`/profile/${listing.user.id}`} className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {listing.user.image ? (
                  <img src={listing.user.image} alt={listing.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-teal-700">{listing.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{listing.user.name}</p>
                {listing.user.city && (
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.user.city}</p>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
              Verified member since {new Date(listing.user.createdAt).getFullYear()}
            </div>

            <ContactSellerSection listing={listing} session={session} currentRequest={currentRequest} />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="font-semibold text-amber-800 text-sm mb-2">Safety Tips</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Meet in a public or well-lit place when possible</li>
              <li>• Bring a friend for unfamiliar pickups</li>
              <li>• Never send money for a supposedly free item</li>
              <li>• Report suspicious listings or users</li>
            </ul>
          </div>
        </div>
      </div>

      {moreBySeller.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">More from {listing.user.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {moreBySeller.map((item) => {
              const imgs = parseImages(item.images)
              const cat = getCategoryById(item.category)
              return (
                <Link key={item.id} href={`/listings/${item.id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {imgs[0] ? (
                      <img src={imgs[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{cat?.icon ?? '📦'}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.city}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
