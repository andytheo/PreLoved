import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const updateSchema = z.object({
  enabled: z.boolean(),
  method: z.enum(['email', 'phone']).optional(),
  password: z.string().min(1),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  return NextResponse.json({
    email: user.email,
    phone: user.phone,
    emailVerified: !!user.emailVerifiedAt,
    phoneVerified: !!user.phoneVerifiedAt,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod || 'email',
  })
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.password)
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
    }

    if (parsed.data.enabled) {
      if (!user.emailVerifiedAt || !user.phoneVerifiedAt) {
        return NextResponse.json({ error: 'Verify both email and phone before enabling 2FA' }, { status: 409 })
      }
      const method = parsed.data.method || 'email'
      if (method === 'phone' && !user.phone) {
        return NextResponse.json({ error: 'A verified phone number is required for SMS 2FA' }, { status: 409 })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true, twoFactorMethod: method },
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: false },
      })
      await prisma.verificationCode.deleteMany({
        where: { userId: user.id, purpose: '2fa', consumedAt: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unable to update two-factor authentication' }, { status: 500 })
  }
}
