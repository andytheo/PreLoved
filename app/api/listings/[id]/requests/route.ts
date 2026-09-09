import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, userId: true, title: true, status: true },
  })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const requests = await prisma.request.findMany({
    where: { listingId: id },
    include: {
      requester: { select: { id: true, name: true, image: true, city: true, createdAt: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ listing, requests })
}
