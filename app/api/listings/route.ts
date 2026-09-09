import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import { boundingBox, clampRadius, haversineKm, isValidCoordinate, publicCoordinate } from '@/lib/geo'

const categoryIds = CATEGORIES.map((category) => category.id)
const conditionIds = CONDITIONS.map((condition) => condition.id)

const createListingSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(2000),
    category: z.string().refine((value) => categoryIds.includes(value), 'Invalid category'),
    condition: z.string().refine((value) => conditionIds.includes(value), 'Invalid condition'),
    city: z.string().min(2).max(100),
    address: z.string().max(200).optional(),
    images: z.array(z.string().url()).max(6).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .superRefine((value, context) => {
    if ((value.lat == null) !== (value.lng == null)) {
      context.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Latitude and longitude must be provided together',
      })
    }
  })

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')
    const city = searchParams.get('city')?.trim()
    const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest'
    const rawLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 60) : 20
    const cursor = searchParams.get('cursor')

    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const lat = latParam == null ? Number.NaN : Number(latParam)
    const lng = lngParam == null ? Number.NaN : Number(lngParam)
    const radiusKm = clampRadius(Number(searchParams.get('radius') ?? '25'))
    const hasGeo = latParam != null && lngParam != null && isValidCoordinate(lat, lng)
    const box = hasGeo ? boundingBox(lat, lng, radiusKm) : null

    const listings = await prisma.listing.findMany({
      where: {
        isAvailable: true,
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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
        ...(category && categoryIds.includes(category) && { category }),
        ...(condition && conditionIds.includes(condition) && { condition }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(box && {
          lat: { gte: box.minLat, lte: box.maxLat },
          lng: { gte: box.minLng, lte: box.maxLng },
        }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        images: true,
        city: true,
        lat: true,
        lng: true,
        status: true,
        isAvailable: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: { select: { id: true, name: true, image: true, city: true } },
        _count: { select: { favorites: true, requests: true } },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      take: hasGeo ? 200 : limit + 1,
      ...(!hasGeo && cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const filtered = hasGeo
      ? listings.filter(
          (listing) =>
            listing.lat != null &&
            listing.lng != null &&
            haversineKm(lat, lng, listing.lat, listing.lng) <= radiusKm
        )
      : listings

    const hasMore = !hasGeo && filtered.length > limit
    const page = filtered.slice(0, limit).map((listing) => ({
      ...listing,
      lat: publicCoordinate(listing.lat),
      lng: publicCoordinate(listing.lng),
    }))
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

    return NextResponse.json({ items: page, nextCursor, radiusKm: hasGeo ? radiusKm : null })
  } catch (error) {
    console.error('Failed to fetch listings', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = createListingSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, category, condition, city, address, images = [], lat, lng } = parsed.data

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        city: city.trim(),
        address: address?.trim() || null,
        images: JSON.stringify(images),
        lat: lat ?? null,
        lng: lng ?? null,
        userId: session.user.id,
        status: 'AVAILABLE',
        isAvailable: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        images: true,
        city: true,
        status: true,
        isAvailable: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('Failed to create listing', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
