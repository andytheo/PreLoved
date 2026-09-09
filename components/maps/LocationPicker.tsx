'use client'

import dynamic from 'next/dynamic'

type Position = { lat: number; lng: number }

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-72 sm:h-80 w-full rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />,
})

export default function LocationPicker({
  value,
  onChange,
}: {
  value: Position | null
  onChange: (position: Position) => void
}) {
  return <LocationPickerMap value={value} onChange={onChange} />
}
