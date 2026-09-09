import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  createVerificationCode,
  isValidE164,
  normalizePhone,
  sendEmailCode,
  sendSmsCode,
} from '@/lib/verification'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().refine(isValidE164, 'Phone number must use international format, e.g. +14165551234'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  city: z.string().min(2).max(100),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, phone, password, city } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = normalizePhone(phone)

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
      select: { email: true, phone: true },
    })

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.email === normalizedEmail
              ? 'An account with this email already exists'
              : 'An account with this phone number already exists',
        },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        city: city.trim(),
      },
    })

    let deliveryWarning: string | undefined
    try {
      const [emailCode, phoneCode] = await Promise.all([
        createVerificationCode(user.id, 'signup', 'email'),
        createVerificationCode(user.id, 'signup', 'phone'),
      ])

      await Promise.all([
        sendEmailCode(user.email, emailCode.code, 'signup'),
        sendSmsCode(user.phone!, phoneCode.code, 'signup'),
      ])
    } catch (error) {
      console.error('Unable to deliver initial verification codes', error)
      deliveryWarning =
        'Your account was created, but verification codes could not be delivered. Use Resend Code after the providers are configured.'
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        verificationRequired: true,
        deliveryWarning,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
