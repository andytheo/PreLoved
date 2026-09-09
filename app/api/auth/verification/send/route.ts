import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  createVerificationCode,
  sendEmailCode,
  sendSmsCode,
  type VerificationChannel,
} from '@/lib/verification'

const schema = z.object({
  userId: z.string().min(1),
  channel: z.enum(['email', 'phone']),
})

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { userId, channel } = parsed.data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true },
    })

    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    if (channel === 'email' && user.emailVerifiedAt) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }
    if (channel === 'phone' && user.phoneVerifiedAt) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }
    if (channel === 'phone' && !user.phone) {
      return NextResponse.json({ error: 'No phone number is attached to this account' }, { status: 400 })
    }

    const { code } = await createVerificationCode(user.id, 'signup', channel as VerificationChannel)
    if (channel === 'email') await sendEmailCode(user.email, code, 'signup')
    else await sendSmsCode(user.phone!, code, 'signup')

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send verification code'
    const status = message.startsWith('Please wait') ? 429 : 503
    return NextResponse.json({ error: message }, { status })
  }
}
