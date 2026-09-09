import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createVerificationCode, sendEmailCode } from '@/lib/verification'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ success: true })

    const email = parsed.data.email.toLowerCase().trim()
    const rateLimit = await consumeRateLimit(
      'password_reset',
      requestIdentity(req, email),
      5,
      30 * 60 * 1000
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success so this endpoint does not reveal whether an email is registered.
    if (!user) return NextResponse.json({ success: true })

    const { code } = await createVerificationCode(user.id, 'password_reset', 'email')
    await sendEmailCode(user.email, code, 'password_reset')

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send reset code'
    return NextResponse.json({ error: message }, { status: message.startsWith('Please wait') ? 429 : 503 })
  }
}
