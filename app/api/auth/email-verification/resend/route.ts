import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationExpiry,
      },
    })

    await sendVerificationEmail(user.email, verificationToken, user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend verification email failed:', error)
    return NextResponse.json({ error: 'Unable to resend verification email' }, { status: 500 })
  }
}
