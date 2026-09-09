import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { consumeVerificationCode } from '@/lib/verification'

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reset request' }, { status: 400 })

    const email = parsed.data.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 })

    const valid = await consumeVerificationCode(user.id, 'password_reset', 'email', parsed.data.code)
    if (!valid) return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 })

    const password = await bcrypt.hash(parsed.data.password, 12)
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password } }),
      prisma.verificationCode.deleteMany({ where: { userId: user.id, purpose: '2fa', consumedAt: null } }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
