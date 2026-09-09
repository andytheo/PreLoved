import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

const actionSchema = z.object({
  action: z.enum(['accept', 'decline', 'cancel', 'complete']),
})

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = actionSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const itemRequest = await prisma.request.findUnique({
    where: { id },
    include: { listing: { select: { id: true, title: true, userId: true, status: true, isAvailable: true } } },
  })
  if (!itemRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const isOwner = itemRequest.listing.userId === session.user.id
  const isRequester = itemRequest.requesterId === session.user.id
  const action = parsed.data.action

  if (action === 'cancel') {
    if (!isRequester) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!['PENDING', 'ACCEPTED'].includes(itemRequest.status)) {
      return NextResponse.json({ error: 'This request cannot be cancelled' }, { status: 409 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.request.update({ where: { id }, data: { status: 'CANCELLED' } })
      if (itemRequest.status === 'ACCEPTED') {
        await tx.listing.update({
          where: { id: itemRequest.listing.id },
          data: { status: 'AVAILABLE', isAvailable: true },
        })
      }
      await tx.notification.create({
        data: {
          userId: itemRequest.listing.userId,
          type: 'REQUEST_CANCELLED',
          title: 'Request cancelled',
          body: `A request for “${itemRequest.listing.title}” was cancelled.`,
          href: `/listings/${itemRequest.listing.id}/requests`,
        },
      })
    })

    return NextResponse.json({ success: true, status: 'CANCELLED' })
  }

  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (action === 'decline') {
    if (itemRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be declined' }, { status: 409 })
    }
    await prisma.$transaction([
      prisma.request.update({ where: { id }, data: { status: 'DECLINED' } }),
      prisma.notification.create({
        data: {
          userId: itemRequest.requesterId,
          type: 'REQUEST_DECLINED',
          title: 'Request update',
          body: `Your request for “${itemRequest.listing.title}” was not selected.`,
          href: `/listings/${itemRequest.listing.id}`,
        },
      }),
    ])
    return NextResponse.json({ success: true, status: 'DECLINED' })
  }

  if (action === 'accept') {
    if (itemRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be accepted' }, { status: 409 })
    }
    if (!itemRequest.listing.isAvailable || itemRequest.listing.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This item is no longer available' }, { status: 409 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.request.update({ where: { id }, data: { status: 'ACCEPTED' } })
      await tx.request.updateMany({
        where: { listingId: itemRequest.listing.id, id: { not: id }, status: 'PENDING' },
        data: { status: 'DECLINED' },
      })
      await tx.listing.update({
        where: { id: itemRequest.listing.id },
        data: { status: 'RESERVED', isAvailable: false },
      })
      await tx.notification.create({
        data: {
          userId: itemRequest.requesterId,
          type: 'REQUEST_ACCEPTED',
          title: 'Your request was accepted',
          body: `You were selected for “${itemRequest.listing.title}”. Pickup details are now visible on the listing.`,
          href: `/listings/${itemRequest.listing.id}`,
        },
      })
    })

    return NextResponse.json({ success: true, status: 'ACCEPTED' })
  }

  if (action === 'complete') {
    if (itemRequest.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Only an accepted request can be completed' }, { status: 409 })
    }
    await prisma.$transaction([
      prisma.request.update({ where: { id }, data: { status: 'COMPLETED' } }),
      prisma.listing.update({
        where: { id: itemRequest.listing.id },
        data: { status: 'GIVEN', isAvailable: false },
      }),
      prisma.notification.create({
        data: {
          userId: itemRequest.requesterId,
          type: 'HANDOFF_COMPLETED',
          title: 'Handoff completed',
          body: `“${itemRequest.listing.title}” has been marked as given.`,
          href: `/listings/${itemRequest.listing.id}`,
        },
      }),
    ])
    return NextResponse.json({ success: true, status: 'COMPLETED' })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
