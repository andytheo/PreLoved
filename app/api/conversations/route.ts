import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  listingId: z.string().min(1),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        buyerId: true,
        sellerId: true,
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true } },
      },
    })

    return NextResponse.json(conversations)
  } catch {
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!session.user.emailVerified) {
      return NextResponse.json({ error: 'Verify your email before messaging sellers' }, { status: 403 })
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const buyerId = session.user.id
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
      select: { id: true, userId: true, isAvailable: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.userId === buyerId) {
      return NextResponse.json({ error: 'You cannot message yourself about your own listing' }, { status: 400 })
    }

    const existing = await prisma.conversation.findUnique({
      where: { listingId_buyerId: { listingId: listing.id, buyerId } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ id: existing.id })
    }
    if (!listing.isAvailable) {
      return NextResponse.json({ error: 'This listing is no longer available' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: { listingId: listing.id, buyerId, sellerId: listing.userId },
      select: { id: true },
    })

    return NextResponse.json({ id: conversation.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
  }
}
