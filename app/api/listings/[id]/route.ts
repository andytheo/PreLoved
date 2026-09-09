import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CATEGORIES, CONDITIONS } from '@/lib/categories'
import { publicCoordinate } from '@/lib/geo'

interface Params {
  params: Promise<{ id: string }>
}

const categoryIds = CATEGORIES.map((category) => category.id)
const conditionIds = CONDITIONS.map((condition) => condition.id)

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, city: true, bio: true, createdAt: true } },
        _count: { select: { favorites: true, requests: true } },
      },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isOwner = session?.user?.id === listing.userId
    const acceptedRequest = session?.user?.id
      ? await prisma.request.findFirst({
          where: {
            listingId: listing.id,
            requesterId: session.user.id,
            status: { in: ['ACCEPTED', 'COMPLETED'] },
          },
          select: { id: true },
        })
      : null
    const canSeePickup = isOwner || !!acceptedRequest

    const { address, lat, lng, ...publicListing } = listing
    return NextResponse.json({
      ...publicListing,
      lat: publicCoordinate(lat),
      lng: publicCoordinate(lng),
      pickup: canSeePickup ? { address } : null,
    })
  } catch (error) {
    console.error('Failed to fetch listing', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

const updateSchema = z
  .object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    category: z.string().refine((value) => categoryIds.includes(value), 'Invalid category').optional(),
    condition: z.string().refine((value) => conditionIds.includes(value), 'Invalid condition').optional(),
    city: z.string().min(2).max(100).optional(),
    address: z.string().max(200).optional().nullable(),
    images: z.array(z.string().url()).max(6).optional(),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
    isAvailable: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if ((value.lat === undefined) !== (value.lng === undefined)) {
      context.addIssue({ code: 'custom', path: ['lat'], message: 'Latitude and longitude must be updated together' })
    }
  })

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { images, isAvailable, lat, lng, ...rest } = parsed.data
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.title !== undefined && { title: rest.title.trim() }),
        ...(rest.description !== undefined && { description: rest.description.trim() }),
        ...(rest.city !== undefined && { city: rest.city.trim() }),
        ...(rest.address !== undefined && { address: rest.address?.trim() || null }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        ...(lat !== undefined && lng !== undefined && { lat, lng }),
        ...(isAvailable !== undefined && {
          isAvailable,
          status: isAvailable ? 'AVAILABLE' : 'GIVEN',
          ...(isAvailable && { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
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
        status: true,
        isAvailable: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update listing', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.listing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete listing', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
