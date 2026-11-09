import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isConversationParticipant, messageBodySchema, MESSAGE_MAX_LENGTH } from '@/lib/messaging'
import { consumeRateLimit } from '@/lib/rate-limit'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!session.user.emailVerified) {
      return NextResponse.json({ error: 'Verify your email before sending messages' }, { status: 403 })
    }

    const parsed = messageBodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: `Message must be 1 to ${MESSAGE_MAX_LENGTH} characters` }, { status: 400 })
    }

    const userId = session.user.id
    const rateLimit = await consumeRateLimit('messages', userId, 30, 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'You are sending messages too quickly. Please wait a moment.' }, { status: 429 })
    }

    const { id } = await params
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true },
    })
    if (!conversation || !isConversationParticipant(conversation, userId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, senderId: userId, body: parsed.data.body },
        select: { id: true, body: true, createdAt: true, senderId: true },
      }),
      prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() }, select: { id: true } }),
    ])

    return NextResponse.json(message, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
