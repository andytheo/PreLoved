import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { consumeVerificationCode } from '@/lib/verification'

const schema = z.object({
  userId: z.string().min(1),
  channel: z.enum(['email', 'phone']),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter the 6-digit verification code' }, { status: 400 })
    }

    const { userId, channel, code } = parsed.data
    const valid = await consumeVerificationCode(userId, 'signup', channel, code)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data:
        channel === 'email'
          ? { emailVerifiedAt: new Date() }
          : { phoneVerifiedAt: new Date() },
      select: { emailVerifiedAt: true, phoneVerifiedAt: true },
    })

    return NextResponse.json({
      success: true,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      fullyVerified: !!user.emailVerifiedAt && !!user.phoneVerifiedAt,
    })
  } catch {
    return NextResponse.json({ error: 'Unable to verify code' }, { status: 500 })
  }
}
