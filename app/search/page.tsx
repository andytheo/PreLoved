import { prisma } from '@/lib/prisma'
import { ListingWithUser } from '@/types'
import ListingCard from '@/components/listings/ListingCard'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import GeoSearchControls from '@/components/search/GeoSearchControls'
import MarketplaceMap from '@/components/maps/MarketplaceMap'
import { boundingBox, clampRadius, haversineKm, isValidCoordinate, publicCoordinate } from '@/lib/geo'

interface SearchParams {
  q?: string
  category?: string
  condition?: string
  city?: string
  sort?: string
  lat?: string
  lng?: string
  radius?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function searchListings(params: SearchParams, currentUserId?: string): Promise<ListingWithUser[]> {
  const q = params.q?.trim()
  const city = params.city?.trim()
  const categoryIds = CATEGORIES.map((category) => category.id)
  const conditionIds = CONDITIONS.map((condition) => condition.id)
  const lat = Number(params.lat)
  const lng = Number(params.lng)
  const radiusKm = clampRadius(Number(params.radius ?? '25'))
  const hasGeo = isValidCoordinate(lat, lng)
  const box = hasGeo ? boundingBox(lat, lng, radiusKm) : null

  let blockedUserIds: string[] = []
  if (currentUserId) {
    const blocks = await prisma.block.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
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
      ...(blockedUserIds.length > 0 && { userId: { notIn: blockedUserIds } }),
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
      ...(box && {
        lat: { gte: box.minLat, lte: box.maxLat },
        lng: { gte: box.minLng, lte: box.maxLng },
      }),
    },
    include: {
      user: { select: { id: true, name: true, image: true, city: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: params.sort === 'oldest' ? 'asc' : 'desc' },
    take: hasGeo ? 200 : 60,
  })

  const filtered = hasGeo
    ? listings.filter(
        (listing) =>
          listing.lat != null &&
          listing.lng != null &&
          haversineKm(lat, lng, listing.lat, listing.lng) <= radiusKm
      )
    : listings

  return filtered.slice(0, 60) as ListingWithUser[]
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const session = await getServerSession(authOptions)
  const listings = await searchListings(params, session?.user?.id)

  const lat = Number(params.lat)
  const lng = Number(params.lng)
  const radiusKm = clampRadius(Number(params.radius ?? '25'))
  const hasGeo = isValidCoordinate(lat, lng)
  const mapListings = listings
    .filter((listing) => listing.lat != null && listing.lng != null)
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      city: listing.city,
      lat: publicCoordinate(listing.lat)!,
      lng: publicCoordinate(listing.lng)!,
    }))

  const buildUrl = (updates: Partial<SearchParams>) => {
    const next = { ...params, ...updates }
    const filtered = Object.entries(next).filter(([, value]) => value !== undefined && value !== '')
    return `/search?${new URLSearchParams(filtered as [string, string][]).toString()}`
  }

  const clearUrl = (key: keyof SearchParams) => {
    const next = { ...params }
    delete next[key]
    const filtered = Object.entries(next).filter(([, value]) => value !== undefined && value !== '')
    return `/search${filtered.length ? `?${new URLSearchParams(filtered as [string, string][]).toString()}` : ''}`
  }

  const clearGeoUrl = () => {
    const next = { ...params }
    delete next.lat
    delete next.lng
    delete next.radius
    const filtered = Object.entries(next).filter(([, value]) => value !== undefined && value !== '')
    return `/search${filtered.length ? `?${new URLSearchParams(filtered as [string, string][]).toString()}` : ''}`
  }

  const hasActiveFilters = !!(params.q || params.category || params.condition || params.city || hasGeo)

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-14 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <SearchForm params={params} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2">
            <p className="text-sm font-semibold text-gray-900">Find free items near you</p>
            <p className="text-xs text-gray-500">Use your current location and choose a radius, or search by city/region anywhere in the world.</p>
          </div>
          <GeoSearchControls active={hasGeo} radiusKm={radiusKm} />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="w-full flex-shrink-0 lg:w-56">
            <div className="lg:sticky lg:top-32">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </span>
                {hasActiveFilters && (
                  <Link href="/search" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0BA8A4] hover:underline">Clear all</Link>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:block">
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
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                {listings.length} {listings.length === 1 ? 'item' : 'items'}
                {params.city && ` in ${params.city}`}
                {hasGeo && ` within ${radiusKm} km`}
              </span>
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 sm:ml-2">
                  {params.q && <ActivePill label={`“${params.q}”`} href={clearUrl('q')} />}
                  {params.category && <ActivePill label={CATEGORIES.find((category) => category.id === params.category)?.name ?? params.category} href={clearUrl('category')} />}
                  {params.condition && <ActivePill label={CONDITIONS.find((condition) => condition.id === params.condition)?.name ?? params.condition} href={clearUrl('condition')} />}
                  {params.city && <ActivePill label={params.city} href={clearUrl('city')} icon={<MapPin className="h-3 w-3" />} />}
                  {hasGeo && <ActivePill label={`${radiusKm} km nearby`} href={clearGeoUrl()} icon={<MapPin className="h-3 w-3" />} />}
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="min-w-0 order-2 xl:order-1">
                {listings.length === 0 ? (
                  <div className="border border-dashed border-gray-300 px-4 py-16 text-center">
                    <Search className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-700">No Items Found</h3>
                    <p className="mb-6 text-sm text-gray-500">Try a wider radius, another city, or fewer filters.</p>
                    <Link href="/search" className="bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-gray-800">Clear Filters</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                  </div>
                )}
              </div>

              <div className="order-1 xl:order-2 xl:sticky xl:top-32 xl:self-start">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-600">Map</p>
                  <p className="text-[10px] text-gray-400">Approximate locations only</p>
                </div>
                <MarketplaceMap
                  listings={mapListings}
                  center={hasGeo ? { lat, lng } : null}
                  radiusKm={hasGeo ? radiusKm : null}
                />
                {mapListings.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">Listings without a map pin still appear in the list. New listings can add an approximate location.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-0 lg:mb-6">
      <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function FilterOption({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2 px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${active ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50 hover:text-black'}`}>
      <span className={`h-1 w-1 flex-shrink-0 rounded-full ${active ? 'bg-black' : 'bg-transparent'}`} />
      {label}
    </Link>
  )
}

function ActivePill({ label, href, icon }: { label: string; href: string; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-gray-800">
      {icon}{label}<X className="h-3 w-3" />
    </Link>
  )
}

function SearchForm({ params }: { params: SearchParams }) {
  return (
    <form action="/search" method="GET" className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,220px)_auto]">
      <div className="flex items-center border border-gray-300 transition-colors focus-within:border-black">
        <Search className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
        <input name="q" defaultValue={params.q ?? ''} placeholder="Search items..." className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="flex items-center border border-gray-300 transition-colors focus-within:border-black">
        <MapPin className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
        <input name="city" defaultValue={params.city ?? ''} placeholder="City or region..." className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
      </div>
      {params.category && <input type="hidden" name="category" value={params.category} />}
      {params.condition && <input type="hidden" name="condition" value={params.condition} />}
      {params.sort && <input type="hidden" name="sort" value={params.sort} />}
      <button type="submit" className="bg-black px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-gray-800">Search</button>
    </form>
  )
}
