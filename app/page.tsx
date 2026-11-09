import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import ListingCard from '@/components/listings/ListingCard'
import { ListingWithUser } from '@/types'
import Link from 'next/link'
import HowItWorks from '@/components/home/HowItWorks'
import HeroCarousel from '@/components/home/HeroCarousel'
import { ArrowRight, PackageOpen } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function activeListingWhere(): Prisma.ListingWhereInput {
  return {
    isAvailable: true,
    status: 'AVAILABLE',
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  }
}

async function getRecentListings(): Promise<ListingWithUser[]> {
  const listings = await prisma.listing.findMany({
    where: activeListingWhere(),
    include: {
      user: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })
  return listings as ListingWithUser[]
}

async function getStats() {
  const [listingCount, userCount] = await Promise.all([
    prisma.listing.count({ where: activeListingWhere() }),
    prisma.user.count(),
  ])
  return { listingCount, userCount }
}

const CATEGORY_TILES = [
  { id: 'clothing', label: 'Clothing', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80', credit: 'Tamara Bellis', creditUrl: 'https://unsplash.com/@tamarabellis' },
  { id: 'furniture', label: 'Furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', credit: 'Kam Idris', creditUrl: 'https://unsplash.com/@kamiceri' },
  { id: 'electronics', label: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', credit: 'Nikolai Chernichenko', creditUrl: 'https://unsplash.com/@perfectsnap' },
  { id: 'books', label: 'Books', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80', credit: 'Kimberly Farmer', creditUrl: 'https://unsplash.com/@kimberlyfarmer' },
  { id: 'toys', label: 'Toys', image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600&q=80', credit: 'Xavi Cabrera', creditUrl: 'https://unsplash.com/@xavi_cabrera' },
  { id: 'kitchen', label: 'Kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80', credit: 'Jason Briscoe', creditUrl: 'https://unsplash.com/@jbriscoe24' },
]

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const [listings, stats] = await Promise.all([getRecentListings(), getStats()])

  return (
    <div>
      <HeroCarousel hasSession={!!session} />

      <section className="bg-[#0BA8A4] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-3 divide-x divide-white/20">
            {[
              { value: `${stats.listingCount}+`, label: 'Items Available' },
              { value: `${stats.userCount}+`, label: 'Community Members' },
              { value: '$0', label: 'Always Free' },
            ].map((stat) => (
              <div key={stat.label} className="px-2 py-4 text-center sm:px-4 sm:py-5">
                <div className="text-lg font-black sm:text-2xl">{stat.value}</div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75 sm:text-[10px] sm:tracking-[0.15em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Discover</p>
              <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl md:text-3xl">Browse by Category</h2>
            </div>
            <Link href="/search" className="flex flex-shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 transition-colors hover:text-black sm:text-[11px]">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORY_TILES.map((category) => (
              <Link key={category.id} href={`/search?category=${category.id}`} className="group relative block aspect-square overflow-hidden rounded-sm">
                <img src={category.image} alt={category.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/50" />
                <div className="absolute inset-0 flex items-end p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white">{category.label}</span>
                </div>
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-2 pb-3 pt-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="truncate text-[8px] tracking-wide text-white/70">
                    Photo by <span className="underline">{category.credit}</span> on Unsplash
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Latest</p>
              <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl md:text-3xl">Recently Posted</h2>
            </div>
            <Link href="/search" className="flex flex-shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 transition-colors hover:text-black sm:text-[11px]">
              See All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="border border-dashed border-gray-300 bg-white px-4 py-16 text-center sm:py-20">
              <PackageOpen className="mx-auto mb-4 h-10 w-10 text-gray-300" />
              <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-700">No Items Yet</h3>
              <p className="mb-6 text-sm text-gray-500">Be the first to post a free item in your community.</p>
              <Link href="/listings/new" className="bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-gray-800">Post an Item</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </div>
      </section>

      <HowItWorks />
    </div>
  )
}
