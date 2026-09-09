import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().max(500).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.request.findMany({
    where: { requesterId: session.user.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          images: true,
          city: true,
          status: true,
          isAvailable: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
      select: { id: true, title: true, userId: true, status: true, isAvailable: true },
    })

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot request your own item' }, { status: 400 })
    }
    if (!listing.isAvailable || listing.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This item is no longer accepting requests' }, { status: 409 })
    }

    const existing = await prisma.request.findUnique({
      where: { requesterId_listingId: { requesterId: session.user.id, listingId: listing.id } },
    })
    if (existing && !['DECLINED', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json({ error: 'You already requested this item', request: existing }, { status: 409 })
    }

    const request = existing
      ? await prisma.request.update({
          where: { id: existing.id },
          data: { status: 'PENDING', message: parsed.data.message || null },
        })
      : await prisma.request.create({
          data: {
            listingId: listing.id,
            requesterId: session.user.id,
            message: parsed.data.message || null,
          },
        })

    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'REQUEST_RECEIVED',
        title: 'New item request',
        body: `Someone requested “${listing.title}”.`,
        href: `/listings/${listing.id}/requests`,
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to request this item' }, { status: 500 })
  }
}
