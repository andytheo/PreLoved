import { prisma } from '@/lib/prisma'
import { ListingWithUser } from '@/types'
import ListingCard from '@/components/listings/ListingCard'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react'

interface SearchParams {
  q?: string
  category?: string
  condition?: string
  city?: string
  sort?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function searchListings(params: SearchParams, currentUserId?: string): Promise<ListingWithUser[]> {
  const q = params.q?.trim()
  const city = params.city?.trim()
  const categoryIds = CATEGORIES.map((category) => category.id)
  const conditionIds = CONDITIONS.map((condition) => condition.id)

  let blockedUserIds: string[] = []
  if (currentUserId) {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
      select: { blockerId: true, blockedId: true },
    })
    blockedUserIds = blocks.map((block) =>
      block.blockerId === currentUserId ? block.blockedId : block.blockerId
    )
  }

  const listings = await prisma.listing.findMany({
    where: {
      isAvailable: true,
      status: 'AVAILABLE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...(blockedUserIds.length && { userId: { notIn: blockedUserIds } }),
      ...(q && {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      }),
      ...(params.category && categoryIds.includes(params.category) && { category: params.category }),
      ...(params.condition && conditionIds.includes(params.condition) && { condition: params.condition }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
    },
    include: {
      user: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: params.sort === 'oldest' ? 'asc' : 'desc' },
    take: 60,
  })

  return listings as ListingWithUser[]
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const listings = await searchListings(params, session?.user?.id)

  const buildUrl = (updates: Partial<SearchParams>) => {
    const next = { ...params, ...updates }
    const filtered = Object.entries(next).filter(([, value]) => value)
    return `/search?${new URLSearchParams(filtered as [string, string][]).toString()}`
  }

  const clearUrl = (key: keyof SearchParams) => {
    const next = { ...params }
    delete next[key]
    const filtered = Object.entries(next).filter(([, value]) => value)
    return `/search${filtered.length ? `?${new URLSearchParams(filtered as [string, string][]).toString()}` : ''}`
  }

  const hasActiveFilters = !!(params.q || params.category || params.condition || params.city)

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <SearchForm defaultQ={params.q ?? ''} defaultCity={params.city ?? ''} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="sticky top-32">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] tracking-[0.2em] uppercase font-bold flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
                </span>
                {hasActiveFilters && (
                  <Link href="/search" className="text-[10px] tracking-[0.12em] uppercase font-bold text-[#0BA8A4] hover:underline">Clear all</Link>
                )}
              </div>

              <FilterGroup title="Category">
                <FilterOption href={clearUrl('category')} active={!params.category} label="All Categories" />
                {CATEGORIES.map((category) => (
                  <FilterOption key={category.id} href={buildUrl({ category: category.id })} active={params.category === category.id} label={`${category.icon} ${category.name}`} />
                ))}
              </FilterGroup>

              <FilterGroup title="Condition">
                <FilterOption href={clearUrl('condition')} active={!params.condition} label="Any Condition" />
                {CONDITIONS.map((condition) => (
                  <FilterOption key={condition.id} href={buildUrl({ condition: condition.id })} active={params.condition === condition.id} label={condition.name} />
                ))}
              </FilterGroup>

              <FilterGroup title="Sort By">
                <FilterOption href={buildUrl({ sort: 'newest' })} active={(params.sort ?? 'newest') === 'newest'} label="Newest First" />
                <FilterOption href={buildUrl({ sort: 'oldest' })} active={params.sort === 'oldest'} label="Oldest First" />
              </FilterGroup>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[11px] tracking-[0.12em] uppercase font-bold text-gray-500">
                {listings.length} {listings.length === 1 ? 'item' : 'items'}{params.city && ` in ${params.city}`}
              </span>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 ml-2">
                  {params.q && <ActivePill label={`“${params.q}”`} href={clearUrl('q')} />}
                  {params.category && <ActivePill label={CATEGORIES.find((category) => category.id === params.category)?.name ?? params.category} href={clearUrl('category')} />}
                  {params.condition && <ActivePill label={CONDITIONS.find((condition) => condition.id === params.condition)?.name ?? params.condition} href={clearUrl('condition')} />}
                  {params.city && <ActivePill label={params.city} href={clearUrl('city')} icon={<MapPin className="w-3 h-3" />} />}
                </div>
              )}
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-300">
                <Search className="w-10 h-10 mx-auto text-gray-300 mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">No Items Found</h3>
                <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or searching in a different location.</p>
                <Link href="/search" className="bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-gray-800 transition-colors">Clear Filters</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-gray-400 mb-2.5">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function FilterOption({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${active ? 'text-black bg-gray-100' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}>
      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${active ? 'bg-black' : 'bg-transparent'}`} />
      {label}
    </Link>
  )
}

function ActivePill({ label, href, icon }: { label: string; href: string; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-gray-800 transition-colors">
      {icon}{label}<X className="w-3 h-3" />
    </Link>
  )
}

function SearchForm({ defaultQ, defaultCity }: { defaultQ: string; defaultCity: string }) {
  return (
    <form action="/search" method="GET" className="flex py-3">
      <div className="flex-1 flex items-center border border-gray-300 focus-within:border-black transition-colors">
        <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
        <input name="q" defaultValue={defaultQ} placeholder="Search items..." className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="flex items-center border-y border-r border-gray-300 focus-within:border-black transition-colors w-40">
        <MapPin className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
        <input name="city" defaultValue={defaultCity} placeholder="City..." className="flex-1 min-w-0 bg-transparent px-2 py-2.5 text-sm outline-none" />
      </div>
      <button type="submit" className="bg-black hover:bg-gray-800 text-white px-6 text-[11px] tracking-[0.1em] uppercase font-bold transition-colors">Search</button>
    </form>
  )
}
