'use client'

import { useState } from 'react'
import { LocateFixed, Loader2, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function GeoSearchControls({ active, radiusKm }: { active: boolean; radiusKm: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const updateWithLocation = (radius: number) => {
    setError('')
    if (!navigator.geolocation) {
      setError('Location access is not supported by this browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('lat', coords.latitude.toFixed(6))
        params.set('lng', coords.longitude.toFixed(6))
        params.set('radius', String(radius))
        params.delete('city')
        router.push(`/search?${params.toString()}`)
        setLocating(false)
      },
      () => {
        setError('We could not access your location. You can still search by city.')
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('lat')
    params.delete('lng')
    params.delete('radius')
    router.push(`/search${params.size ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateWithLocation(radiusKm)}
          disabled={locating}
          className="inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider hover:border-black disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {active ? 'Update my location' : 'Use my location'}
        </button>

        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
          Within
          <select
            value={radiusKm}
            onChange={(event) => active && updateWithLocation(Number(event.target.value))}
            className="border border-gray-300 bg-white px-2 py-2 text-sm"
            aria-label="Search radius"
          >
            {[5, 10, 25, 50, 100].map((radius) => (
              <option key={radius} value={radius}>{radius} km</option>
            ))}
          </select>
        </label>

        {active && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black">
            <X className="h-3.5 w-3.5" /> Clear area
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
