'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, MapPin, Loader2, ArrowLeft, ImagePlus, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import { parseImages } from '@/lib/utils'

const listingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().min(1),
  condition: z.string().min(1),
  city: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  isAvailable: z.boolean(),
})

type ListingForm = z.infer<typeof listingSchema>

interface Listing {
  id: string
  title: string
  description: string
  category: string
  condition: string
  images: string
  city: string
  address?: string | null
  isAvailable: boolean
}

export default function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter()
  const [images, setImages] = useState<string[]>(parseImages(listing.images))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      city: listing.city,
      address: listing.address ?? '',
      isAvailable: listing.isAvailable,
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (images.length + files.length > 6) { setError('Max 6 images'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const { urls } = await res.json() as { urls: string[] }
      setImages((prev) => [...prev, ...urls])
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ListingForm) => {
    setError('')
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Update failed'); return }
      router.push(`/listings/${listing.id}`)
    } catch {
      setError('Something went wrong')
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/listings/${listing.id}`} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
          <p className="text-gray-500 text-sm">Update your item details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* Availability */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isAvailable')} className="w-4 h-4 accent-teal-600" />
            <div>
              <p className="font-medium text-gray-900">Item is available</p>
              <p className="text-sm text-gray-500">Uncheck to mark as taken / no longer available</p>
            </div>
          </label>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-teal-600" />Photos
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 flex flex-col items-center justify-center gap-2 transition-all">
                {uploading ? <Loader2 className="w-6 h-6 text-teal-400 animate-spin" /> : <><Upload className="w-6 h-6 text-gray-400" /><span className="text-xs text-gray-400">Add Photo</span></>}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Item Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input {...register('title')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea {...register('description')} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select {...register('category')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select {...register('condition')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                {CONDITIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-teal-600" />Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input {...register('city')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Neighbourhood (optional)</label>
            <input {...register('address')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : <><CheckCircle className="w-5 h-5" />Save Changes</>}
        </button>
      </form>
    </>
  )
}
