import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({ userId: z.string().min(1) })

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    include: { blocked: { select: { id: true, name: true, image: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(blocks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.block.upsert({
      where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: target.id } },
      create: { blockerId: session.user.id, blockedId: target.id },
      update: {},
    })

    // A block also cancels pending requests between these users so they cannot keep interacting through old state.
    await tx.request.updateMany({
      where: {
        status: 'PENDING',
        requesterId: target.id,
        listing: { userId: session.user.id },
      },
      data: { status: 'CANCELLED' },
    })
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId: parsed.data.userId },
  })

  return NextResponse.json({ success: true })
}
