import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createVerificationCode, sendEmailCode, sendSmsCode } from '@/lib/verification'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })

    const email = parsed.data.email.toLowerCase().trim()
    const rateLimit = await consumeRateLimit(
      'login',
      requestIdentity(req, email),
      8,
      15 * 60 * 1000
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.emailVerifiedAt || !user.phoneVerifiedAt) {
      return NextResponse.json({ error: 'VERIFY_ACCOUNT', userId: user.id }, { status: 403 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ required: false })
    }

    const channel = user.twoFactorMethod === 'phone' ? 'phone' : 'email'
    if (channel === 'phone' && !user.phone) {
      return NextResponse.json({ error: '2FA phone number is unavailable' }, { status: 409 })
    }

    const { code } = await createVerificationCode(user.id, '2fa', channel)
    if (channel === 'phone') await sendSmsCode(user.phone!, code, '2fa')
    else await sendEmailCode(user.email, code, '2fa')

    return NextResponse.json({ required: true, channel })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start 2FA'
    return NextResponse.json({ error: message }, { status: message.startsWith('Please wait') ? 429 : 500 })
  }
}
