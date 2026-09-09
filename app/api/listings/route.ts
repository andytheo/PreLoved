import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'

const categoryIds = CATEGORIES.map((category) => category.id)
const conditionIds = CONDITIONS.map((condition) => condition.id)

const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().refine((value) => categoryIds.includes(value), 'Invalid category'),
  condition: z.string().refine((value) => conditionIds.includes(value), 'Invalid condition'),
  city: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  images: z.array(z.string()).max(6).optional(),
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

    const listings = await prisma.listing.findMany({
      where: {
        isAvailable: true,
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        ...(q && {
          AND: [
            {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
              ],
            },
          ],
        }),
        ...(category && categoryIds.includes(category) && { category }),
        ...(condition && conditionIds.includes(condition) && { condition }),
        ...(city && { city: { contains: city } }),
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
        user: { select: { id: true, name: true, image: true, city: true } },
        _count: { select: { favorites: true, requests: true } },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasMore = listings.length > limit
    const page = hasMore ? listings.slice(0, limit) : listings
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

    return NextResponse.json({ items: page, nextCursor })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createListingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, description, category, condition, city, address, images = [] } = parsed.data

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        city: city.trim(),
        address: address?.trim() || null,
        images: JSON.stringify(images),
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
  } catch {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
