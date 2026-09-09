'use client'

import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'

type MapListing = {
  id: string
  title: string
  city: string
  lat: number
  lng: number
}

type Center = { lat: number; lng: number } | null

function FitMap({ listings, center }: { listings: MapListing[]; center: Center }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], Math.max(map.getZoom(), 10))
      return
    }

    if (listings.length === 1) {
      map.setView([listings[0].lat, listings[0].lng], 11)
    } else if (listings.length > 1) {
      map.fitBounds(listings.map((listing) => [listing.lat, listing.lng] as [number, number]), {
        padding: [32, 32],
        maxZoom: 12,
      })
    }
  }, [center, listings, map])

  return null
}

export default function MarketplaceMapInner({
  listings,
  center,
  radiusKm,
}: {
  listings: MapListing[]
  center: Center
  radiusKm?: number | null
}) {
  const initial: [number, number] = center
    ? [center.lat, center.lng]
    : listings[0]
      ? [listings[0].lat, listings[0].lng]
      : [20, 0]

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <MapContainer center={initial} zoom={center || listings.length ? 10 : 2} scrollWheelZoom className="h-[320px] sm:h-[380px] lg:h-[520px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMap listings={listings} center={center} />
        {center && radiusKm && (
          <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ fillOpacity: 0.04, weight: 1 }} />
        )}
        {listings.map((listing) => (
          <CircleMarker key={listing.id} center={[listing.lat, listing.lng]} radius={8} pathOptions={{ fillOpacity: 0.9 }}>
            <Popup>
              <div className="min-w-36">
                <a href={`/listings/${listing.id}`} className="font-semibold underline">{listing.title}</a>
                <p>{listing.city}</p>
                <p style={{ fontSize: 11, opacity: 0.7 }}>Location is approximate</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
