import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseImages, formatTimeAgo } from '@/lib/utils'
import { getCategoryById, getConditionById } from '@/lib/categories'
import Link from 'next/link'
import {
  MapPin,
  Clock,
  User,
  ArrowLeft,
  Tag,
  CheckCircle,
  Share2,
  Flag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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
        select: { id: true, name: true, image: true, city: true, bio: true, createdAt: true },
      },
      _count: { select: { favorites: true } },
    },
  })

  if (!listing) notFound()

  const images = parseImages(listing.images)
  const category = getCategoryById(listing.category)
  const condition = getConditionById(listing.condition)
  const isOwner = session?.user?.id === listing.userId

  // Get more from same seller
  const moreBySeller = await prisma.listing.findMany({
    where: { userId: listing.userId, id: { not: id }, isAvailable: true },
    include: { user: { select: { id: true, name: true, image: true, city: true } } },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-teal-600 mb-6 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <ImageGallery images={images} title={listing.title} />

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${category?.color ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {category?.icon} {category?.name ?? listing.category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {condition?.name ?? listing.condition}
                  </span>
                  {!listing.isAvailable && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      No longer available
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-green-600">FREE</div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.city}
                {listing.address && `, ${listing.address}`}
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

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Edit Listing
                </Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Seller Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Posted by</h3>
            <Link
              href={`/profile/${listing.user.id}`}
              className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {listing.user.image ? (
                  <img
                    src={listing.user.image}
                    alt={listing.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-teal-700">
                    {listing.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{listing.user.name}</p>
                {listing.user.city && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {listing.user.city}
                  </p>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
              <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
              Member since {new Date(listing.user.createdAt).getFullYear()}
            </div>

            {/* Contact */}
            <ContactSellerSection listing={listing} session={session} />
          </div>

          {/* Safety Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="font-semibold text-amber-800 text-sm mb-2">Safety Tips</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Meet in a public place</li>
              <li>• Bring a friend if possible</li>
              <li>• Never share financial info</li>
              <li>• Trust your instincts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* More by seller */}
      {moreBySeller.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            More from {listing.user.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {moreBySeller.map((item) => {
              const imgs = parseImages(item.images)
              const cat = getCategoryById(item.category)
              return (
                <Link
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {imgs[0] ? (
                      <img
                        src={imgs[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {cat?.icon ?? '📦'}
                      </div>
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
