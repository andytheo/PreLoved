'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ImagePlus, Loader2, LocateFixed, MapPin, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import LocationPicker from '@/components/maps/LocationPicker'

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Please describe the item in at least 10 characters').max(2000),
  category: z.string().min(1, 'Please select a category'),
  condition: z.string().min(1, 'Please select the condition'),
  city: z.string().min(2, 'Please enter your city').max(100),
  address: z.string().max(200).optional(),
})

type ListingForm = z.infer<typeof listingSchema>
type Position = { lat: number; lng: number }

export default function NewListingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      condition: 'good',
      city: (session?.user as { city?: string })?.city ?? '',
    },
  })

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (images.length + files.length > 6) {
      setError('You can upload a maximum of 6 images.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { urls } = (await res.json()) as { urls: string[] }
      setImages((prev) => [...prev, ...urls])
    } catch {
      setError('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const useMyLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Location access is not supported by this browser. You can place the pin manually.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setLocating(false)
      },
      () => {
        setError('We could not access your location. You can place the pin manually on the map.')
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const onSubmit = async (data: ListingForm) => {
    setError('')
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images, lat: position?.lat, lng: position?.lng }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Failed to create listing.')
        return
      }

      const listing = await res.json()
      router.push(`/listings/${listing.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
        <Link href="/" aria-label="Back to home" className="rounded-xl p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Post a Free Item</h1>
          <p className="text-sm text-gray-500">Share what you no longer need with your community.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <ImagePlus className="h-5 w-5 text-teal-600" /> Photos
            <span className="text-xs font-normal text-gray-400">(up to 6)</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                <img src={url} alt={`Listing photo ${i + 1}`} className="h-full w-full object-cover" />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages((prev) => prev.filter((_, index) => index !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80">
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && <div className="absolute bottom-1 left-1 rounded-full bg-teal-600 px-2 py-0.5 text-xs text-white">Main</div>}
              </div>
            ))}

            {images.length < 6 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 transition-all hover:border-teal-400 hover:bg-teal-50 disabled:opacity-50">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin text-teal-400" /> : <><Upload className="h-6 w-6 text-gray-400" /><span className="text-xs text-gray-400">Add Photo</span></>}
              </button>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageUpload} className="hidden" />
          <p className="mt-3 text-xs text-gray-500">Clear photos from multiple angles help people understand the item.</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900">Item Details</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title *</label>
            <input {...register('title')} placeholder="e.g. Blue IKEA couch, barely used" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description *</label>
            <textarea {...register('description')} rows={4} placeholder="Describe the size, colour, brand, condition and any defects." className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category *</label>
              <select {...register('category')} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Condition *</label>
              <select {...register('condition')} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500">
                {CONDITIONS.map((cond) => <option key={cond.id} value={cond.id}>{cond.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><MapPin className="h-5 w-5 text-teal-600" /> Location</h2>
            <button type="button" onClick={useMyLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:border-black disabled:opacity-50">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Use my location
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">City / Region *</label>
            <input {...register('city')} placeholder="e.g. Lagos, Nigeria or Toronto, ON" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Exact pickup address <span className="font-normal text-gray-400">(optional and private)</span></label>
            <input {...register('address')} placeholder="Only the selected recipient will see this" autoComplete="street-address" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-gray-700">Approximate public map location</label>
              {position && <button type="button" onClick={() => setPosition(null)} className="text-xs font-medium text-gray-500 hover:text-black">Clear pin</button>}
            </div>
            <LocationPicker value={position} onChange={setPosition} />
            <p className="mt-2 text-xs text-gray-500">Click the map or use your current location. The public site shows only an approximate area; your exact pickup address remains private.</p>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {isSubmitting ? 'Posting...' : 'Post Item for Free'}
        </button>
      </form>
    </div>
  )
}
