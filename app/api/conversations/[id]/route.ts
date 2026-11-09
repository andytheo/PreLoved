import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, senderId: true },
        },
      },
    })

    const userId = session.user.id
    if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch {
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 })
  }
}
