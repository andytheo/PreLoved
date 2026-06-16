export interface ListingWithUser {
  id: string
  title: string
  description: string
  category: string
  condition: string
  images: string
  city: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  user: {
    id: string
    name: string
    image?: string | null
    city?: string | null
  }
  _count?: {
    favorites: number
  }
  isFavorited?: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  image?: string | null
  bio?: string | null
  city?: string | null
  createdAt: Date
  _count?: {
    listings: number
  }
}

export type SortOption = 'newest' | 'oldest'
export type ConditionFilter = 'all' | 'new' | 'like-new' | 'good' | 'fair' | 'for-parts'
