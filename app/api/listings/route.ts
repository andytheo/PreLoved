import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().min(1),
  condition: z.string().min(1),
  city: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  images: z.array(z.string()).max(6).optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')
    const city = searchParams.get('city')
    const sort = searchParams.get('sort') ?? 'newest'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 60)

    const listings = await prisma.listing.findMany({
      where: {
        isAvailable: true,
        ...(q && {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }),
        ...(category && { category }),
        ...(condition && { condition }),
        ...(city && { city: { contains: city } }),
      },
      include: {
        user: { select: { id: true, name: true, image: true, city: true } },
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      take: limit,
    })

    return NextResponse.json(listings)
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
        address: address?.trim() ?? null,
        images: JSON.stringify(images),
        userId: session.user.id,
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
