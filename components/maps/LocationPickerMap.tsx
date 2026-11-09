'use client'

import { useEffect } from 'react'
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

type Position = { lat: number; lng: number }

interface Props {
  value: Position | null
  onChange: (position: Position) => void
}

function ClickHandler({ onChange }: { onChange: (position: Position) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

function Recenter({ value }: { value: Position | null }) {
  const map = useMap()

  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 12), { duration: 0.6 })
  }, [map, value])

  return null
}

export default function LocationPickerMap({ value, onChange }: Props) {
  const center: [number, number] = value ? [value.lat, value.lng] : [20, 0]
  const zoom = value ? 12 : 2

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-72 sm:h-80 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <Recenter value={value} />
        {value && (
          <>
            <Circle center={[value.lat, value.lng]} radius={1000} pathOptions={{ fillOpacity: 0.08, weight: 1 }} />
            <CircleMarker center={[value.lat, value.lng]} radius={8} pathOptions={{ fillOpacity: 0.9 }} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
