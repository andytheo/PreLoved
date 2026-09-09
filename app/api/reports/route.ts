import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const reportSchema = z.object({
  listingId: z.string().min(1).optional(),
  reportedUserId: z.string().min(1).optional(),
  reason: z.enum(['scam', 'prohibited_item', 'inappropriate', 'spam', 'unsafe', 'other']),
  details: z.string().trim().max(1000).optional(),
}).refine((value) => value.listingId || value.reportedUserId, 'A report target is required')

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = reportSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid report' }, { status: 400 })

    const { listingId, reportedUserId, reason, details } = parsed.data

    let targetUserId = reportedUserId
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      })
      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      targetUserId = targetUserId || listing.userId
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 })
    }

    const recentDuplicate = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        ...(listingId ? { listingId } : { reportedUserId: targetUserId }),
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    })
    if (recentDuplicate) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        listingId: listingId || null,
        reportedUserId: targetUserId || null,
        reason,
        details: details || null,
      },
      select: { id: true, status: true },
    })

    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to submit report' }, { status: 500 })
  }
}
