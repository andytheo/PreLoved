import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  city: z.string().min(2).max(100),
})

export async function POST(req: Request) {
  try {
    if (!checkRateLimit(`register:${getClientIp(req)}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many sign-up attempts. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, city, phone } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        city: city.trim(),
        phone: phone?.trim() || null,
        role: 'USER',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: verificationExpiry,
      },
    })

    let verificationEmailSent = true
    try {
      await sendVerificationEmail(user.email, verificationToken, user.name)
    } catch (error) {
      console.error('Registration verification email failed:', error)
      verificationEmailSent = false
    }

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, verificationEmailSent },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register failed:', error)
    return NextResponse.json({ error: 'Unable to create account' }, { status: 500 })
  }
}
