import { prisma } from '@/lib/prisma'
import ListingCard from '@/components/listings/ListingCard'
import { ListingWithUser } from '@/types'
import Link from 'next/link'
import { Suspense } from 'react'
import CategorySection from '@/components/home/CategorySection'
import HowItWorks from '@/components/home/HowItWorks'
import HeroCarousel from '@/components/home/HeroCarousel'
import { ArrowRight } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CATEGORIES } from '@/lib/categories'

async function getRecentListings(): Promise<ListingWithUser[]> {
  const listings = await prisma.listing.findMany({
    where: { isAvailable: true },
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
    prisma.listing.count({ where: { isAvailable: true } }),
    prisma.user.count(),
  ])
  return { listingCount, userCount }
}

const CATEGORY_TILES = [
  {
    id: 'clothing',
    label: 'Clothing',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
    credit: 'Tamara Bellis',
    creditUrl: 'https://unsplash.com/@tamarabellis',
  },
  {
    id: 'furniture',
    label: 'Furniture',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    credit: 'Kam Idris',
    creditUrl: 'https://unsplash.com/@kamiceri',
  },
  {
    id: 'electronics',
    label: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    credit: 'Nikolai Chernichenko',
    creditUrl: 'https://unsplash.com/@perfectsnap',
  },
  {
    id: 'books',
    label: 'Books',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    credit: 'Kimberly Farmer',
    creditUrl: 'https://unsplash.com/@kimberlyfarmer',
  },
  {
    id: 'toys',
    label: 'Toys',
    image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=600&q=80',
    credit: 'Xavi Cabrera',
    creditUrl: 'https://unsplash.com/@xavi_cabrera',
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    credit: 'Jason Briscoe',
    creditUrl: 'https://unsplash.com/@jbriscoe24',
  },
]

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const [listings, stats] = await Promise.all([getRecentListings(), getStats()])

  return (
    <div>
      {/* --- HERO CAROUSEL ------------------------------------------------ */}
      <HeroCarousel hasSession={!!session} />
      {/* â”€â”€â”€ STATS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-[#0BA8A4] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex divide-x divide-white/20">
            {[
              { value: `${stats.listingCount}+`, label: 'Items Available' },
              { value: `${stats.userCount}+`,    label: 'Community Members' },
              { value: '$0',                     label: 'Always Free' },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 py-5 px-4 text-center">
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-[10px] tracking-[0.15em] uppercase font-semibold text-white/70 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ SHOP BY CATEGORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-gray-400 mb-1">
                Discover
              </p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/search"
              className="text-[11px] tracking-[0.12em] uppercase font-bold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORY_TILES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="group relative aspect-square overflow-hidden block"
              >
                {/* Image */}
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/55 transition-colors duration-300" />
                {/* Category label */}
                <div className="absolute inset-0 flex items-end justify-start p-3">
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.18em]">
                    {cat.label}
                  </span>
                </div>
                {/* Photo credit — subtle, appears on hover */}
                <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/50 to-transparent px-2 pt-1.5 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[8px] text-white/60 tracking-wide truncate">
                    📷{' '}
                    <a
                      href={cat.creditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white/90 underline"
                    >
                      {cat.credit}
                    </a>
                    {' '}on Unsplash
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ RECENTLY POSTED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-gray-400 mb-1">
                Near You
              </p>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                Recently Posted
              </h2>
            </div>
            <Link
              href="/search"
              className="text-[11px] tracking-[0.12em] uppercase font-bold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
            >
              See All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-300 bg-white">
              <div className="text-5xl mb-4">ðŸ“¦</div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">No Items Yet</h3>
              <p className="text-sm text-gray-500 mb-6">Be the first to post a free item in your community!</p>
              <Link
                href="/listings/new"
                className="bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-gray-800 transition-colors"
              >
                Post an Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* â”€â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <HowItWorks />
    </div>
  )
}

