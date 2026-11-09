'use client'

import dynamic from 'next/dynamic'

type MapListing = {
  id: string
  title: string
  city: string
  lat: number
  lng: number
}

type Center = { lat: number; lng: number } | null

const MarketplaceMapInner = dynamic(() => import('./MarketplaceMapInner'), {
  ssr: false,
  loading: () => <div className="h-[320px] sm:h-[380px] lg:h-[520px] w-full rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />,
})

export default function MarketplaceMap({
  listings,
  center,
  radiusKm,
}: {
  listings: MapListing[]
  center: Center
  radiusKm?: number | null
}) {
  return <MarketplaceMapInner listings={listings} center={center} radiusKm={radiusKm} />
}
