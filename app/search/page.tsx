import { prisma } from '@/lib/prisma'
import { ListingWithUser } from '@/types'
import ListingCard from '@/components/listings/ListingCard'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import Link from 'next/link'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Suspense } from 'react'

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

async function searchListings(params: SearchParams): Promise<ListingWithUser[]> {
  const { q, category, condition, city, sort } = params

  const listings = await prisma.listing.findMany({
    where: {
      isAvailable: true,
      ...(q && {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      }),
      ...(category && { category }),
      ...(condition && { condition }),
      ...(city && { city: { contains: city } }),
    },
    include: {
      user: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
    take: 60,
  })

  return listings as ListingWithUser[]
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const listings = await searchListings(params)

  const buildUrl = (updates: Partial<SearchParams>) => {
    const newParams = { ...params, ...updates }
    const filtered = Object.entries(newParams).filter(([, v]) => v)
    return `/search?${new URLSearchParams(filtered as [string, string][]).toString()}`
  }

  const clearUrl = (key: keyof SearchParams) => {
    const newParams = { ...params }
    delete newParams[key]
    const filtered = Object.entries(newParams).filter(([, v]) => v)
    const qs = filtered.length
      ? `?${new URLSearchParams(filtered as [string, string][]).toString()}`
      : ''
    return `/search${qs}`
  }

  const hasActiveFilters = params.q || params.category || params.condition || params.city

  return (
    <div className="bg-white min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <SearchForm defaultQ={params.q ?? ''} defaultCity={params.city ?? ''} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="sticky top-32">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] tracking-[0.2em] uppercase font-bold flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filter
                </span>
                {hasActiveFilters && (
                  <Link href="/search" className="text-[10px] tracking-[0.12em] uppercase font-bold text-[#0BA8A4] hover:underline">
                    Clear all
                  </Link>
                )}
              </div>

              {/* Category */}
              <FilterGroup title="Category">
                <FilterOption href={clearUrl('category')} active={!params.category} label="All Categories" />
                {CATEGORIES.map((cat) => (
                  <FilterOption
                    key={cat.id}
                    href={buildUrl({ category: cat.id })}
                    active={params.category === cat.id}
                    label={`${cat.icon} ${cat.name}`}
                  />
                ))}
              </FilterGroup>

              {/* Condition */}
              <FilterGroup title="Condition">
                <FilterOption href={clearUrl('condition')} active={!params.condition} label="Any Condition" />
                {CONDITIONS.map((cond) => (
                  <FilterOption
                    key={cond.id}
                    href={buildUrl({ condition: cond.id })}
                    active={params.condition === cond.id}
                    label={cond.name}
                  />
                ))}
              </FilterGroup>

              {/* Sort */}
              <FilterGroup title="Sort By">
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'oldest', label: 'Oldest First' },
                ].map((opt) => (
                  <FilterOption
                    key={opt.id}
                    href={buildUrl({ sort: opt.id })}
                    active={(params.sort ?? 'newest') === opt.id}
                    label={opt.label}
                  />
                ))}
              </FilterGroup>
            </div>
          </aside>

          {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 min-w-0">
            {/* Active filter pills + results count */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[11px] tracking-[0.12em] uppercase font-bold text-gray-500">
                {listings.length} {listings.length === 1 ? 'item' : 'items'}
                {params.city && ` in ${params.city}`}
              </span>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 ml-2">
                  {params.q && <ActivePill label={`"${params.q}"`} href={clearUrl('q')} />}
                  {params.category && (
                    <ActivePill
                      label={CATEGORIES.find((c) => c.id === params.category)?.name ?? params.category}
                      href={clearUrl('category')}
                    />
                  )}
                  {params.condition && (
                    <ActivePill
                      label={CONDITIONS.find((c) => c.id === params.condition)?.name ?? params.condition}
                      href={clearUrl('condition')}
                    />
                  )}
                  {params.city && <ActivePill label={`ðŸ“ ${params.city}`} href={clearUrl('city')} />}
                </div>
              )}
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-300">
                <div className="text-5xl mb-4">ðŸ”</div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">No Items Found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Try adjusting your filters or searching in a different location.
                </p>
                <Link
                  href="/search"
                  className="bg-black text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-gray-800 transition-colors"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
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
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
        active
          ? 'text-black bg-gray-100'
          : 'text-gray-500 hover:text-black hover:bg-gray-50'
      }`}
    >
      {active && <span className="w-1 h-1 bg-black rounded-full flex-shrink-0" />}
      {!active && <span className="w-1 h-1 flex-shrink-0" />}
      {label}
    </Link>
  )
}

function ActivePill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-gray-800 transition-colors"
    >
      {label}
      <X className="w-3 h-3" />
    </Link>
  )
}

function SearchForm({ defaultQ, defaultCity }: { defaultQ: string; defaultCity: string }) {
  return (
    <Suspense fallback={null}>
      <form action="/search" method="GET" className="flex gap-0 py-3">
        <div className="flex-1 flex items-center border border-gray-300 focus-within:border-black transition-colors">
          <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
          <input
            name="q"
            defaultValue={defaultQ}
            placeholder="Search items..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="flex items-center border-y border-r border-gray-300 focus-within:border-black transition-colors w-36">
          <span className="text-gray-400 text-sm ml-3 flex-shrink-0">ðŸ“</span>
          <input
            name="city"
            defaultValue={defaultCity}
            placeholder="City..."
            className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white px-6 text-[11px] tracking-[0.1em] uppercase font-bold transition-colors"
        >
          Search
        </button>
      </form>
    </Suspense>
  )
}


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

