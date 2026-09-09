import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createVerificationCode, sendEmailCode } from '@/lib/verification'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ success: true })

    const email = parsed.data.email.toLowerCase().trim()
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
