import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseImages, formatTimeAgo } from '@/lib/utils'
import { getCategoryById, getConditionById } from '@/lib/categories'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, LockKeyhole, MapPin, Tag } from 'lucide-react'
import DeleteListingButton from '@/components/listings/DeleteListingButton'
import ImageGallery from '@/components/listings/ImageGallery'
import ContactSellerSection from '@/components/listings/ContactSellerSection'
import ReportListingButton from '@/components/safety/ReportListingButton'
import MarketplaceMap from '@/components/maps/MarketplaceMap'
import { publicCoordinate } from '@/lib/geo'

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
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
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
  const verifiedMember = !!listing.user.emailVerifiedAt && !!listing.user.phoneVerifiedAt

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

  const moreByGiver = await prisma.listing.findMany({
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

  const statusLabel = listing.status === 'RESERVED' ? 'Reserved' : listing.status === 'GIVEN' ? 'Given' : 'Available'
  const publicLat = publicCoordinate(listing.lat)
  const publicLng = publicCoordinate(listing.lng)
  const hasMapLocation = publicLat != null && publicLng != null

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <Link href="/search" className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-teal-600 sm:mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-5 lg:col-span-2 lg:space-y-6">
          <ImageGallery images={images} title={listing.title} />

          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${category?.color ?? 'bg-gray-100 text-gray-600'}`}>
                    {category?.icon} {category?.name ?? listing.category}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{condition?.name ?? listing.condition}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${listing.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : listing.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel}
                  </span>
                </div>
                <h1 className="break-words text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{listing.title}</h1>
              </div>
              <div className="text-xl font-bold text-green-600 sm:text-2xl">FREE</div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{listing.city}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatTimeAgo(listing.createdAt)}</span>
              <span className="flex items-center gap-1"><Tag className="h-4 w-4" />{listing._count.favorites} saves</span>
            </div>

            {canSeePickup ? (
              <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-teal-800">Private pickup details</p>
                <p className="text-sm text-teal-900">{listing.address || 'The giver has not added an exact pickup address yet.'}</p>
              </div>
            ) : (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Pickup address protected</p>
                  <p className="mt-1 text-xs text-gray-500">The exact pickup address is shown only to the selected recipient.</p>
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-2 font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700 sm:text-base">{listing.description}</p>
            </div>

            {isOwner && (
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
                <Link href={`/listings/${listing.id}/edit`} className="rounded-xl bg-gray-100 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">Edit Listing</Link>
                <Link href={`/listings/${listing.id}/requests`} className="rounded-xl bg-black py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800">Requests ({listing._count.requests})</Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            )}
          </div>

          {hasMapLocation && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Approximate location</h2>
                  <p className="text-xs text-gray-500">For privacy, the map is rounded to a broad nearby area.</p>
                </div>
                <MapPin className="h-5 w-5 flex-shrink-0 text-teal-600" />
              </div>
              <MarketplaceMap
                listings={[{ id: listing.id, title: listing.title, city: listing.city, lat: publicLat, lng: publicLng }]}
                center={{ lat: publicLat, lng: publicLng }}
                radiusKm={1}
              />
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Posted by</h2>
            <Link href={`/profile/${listing.user.id}`} className="mb-4 flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100">
                {listing.user.image ? (
                  <img src={listing.user.image} alt={listing.user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-teal-700">{listing.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{listing.user.name}</p>
                {listing.user.city && <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{listing.user.city}</p>}
              </div>
            </Link>

            <div className="mb-4 flex flex-wrap items-center gap-1 text-xs text-gray-500">
              <CheckCircle className={`h-3.5 w-3.5 ${verifiedMember ? 'text-teal-500' : 'text-gray-300'}`} />
              <span>{verifiedMember ? 'Email & phone verified' : 'Verification incomplete'}</span>
              <span>·</span>
              <span>Member since {new Date(listing.user.createdAt).getFullYear()}</span>
            </div>

            <ContactSellerSection listing={listing} session={session} currentRequest={currentRequest} />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-amber-800">Safety Tips</h3>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>• Meet in a public or well-lit place when possible</li>
              <li>• Bring someone with you for unfamiliar pickups</li>
              <li>• Never send money for an item listed as free</li>
              <li>• Report suspicious listings or accounts</li>
            </ul>
            {!isOwner && (
              <div className="mt-3 border-t border-amber-200/70 pt-3">
                <ReportListingButton listingId={listing.id} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {moreByGiver.length > 0 && (
        <section className="mt-8 sm:mt-10">
          <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">More from {listing.user.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {moreByGiver.map((item) => {
              const itemImages = parseImages(item.images)
              const itemCategory = getCategoryById(item.category)
              return (
                <Link key={item.id} href={`/listings/${item.id}`} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-md">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    {itemImages[0] ? (
                      <img src={itemImages[0]} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">{itemCategory?.icon ?? '📦'}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
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
