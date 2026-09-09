import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { prisma } from './prisma'

export type VerificationChannel = 'email' | 'phone'
export type VerificationPurpose = 'signup' | '2fa'

const CODE_TTL_MINUTES = 10
const RESEND_COOLDOWN_SECONDS = 60

function secret() {
  const value = process.env.VERIFICATION_SECRET || process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('VERIFICATION_SECRET or NEXTAUTH_SECRET must be configured')
  return value
}

export function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, '')
}

export function isValidE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(phone))
}

export function hashVerificationCode(code: string) {
  return createHmac('sha256', secret()).update(code).digest('hex')
}

export function safeCodeEqual(code: string, codeHash: string) {
  const candidate = Buffer.from(hashVerificationCode(code), 'hex')
  const expected = Buffer.from(codeHash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export async function createVerificationCode(
  userId: string,
  purpose: VerificationPurpose,
  channel: VerificationChannel
) {
  const latest = await prisma.verificationCode.findFirst({
    where: { userId, purpose, channel },
    orderBy: { createdAt: 'desc' },
  })

  if (latest) {
    const elapsed = Date.now() - latest.createdAt.getTime()
    if (elapsed < RESEND_COOLDOWN_SECONDS * 1000) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - elapsed) / 1000)
      throw new Error(`Please wait ${retryAfter} seconds before requesting another code.`)
    }
  }

  await prisma.verificationCode.deleteMany({
    where: { userId, purpose, channel, consumedAt: null },
  })

  const code = randomInt(100000, 1000000).toString()
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.verificationCode.create({
    data: {
      userId,
      purpose,
      channel,
      codeHash: hashVerificationCode(code),
      expiresAt,
    },
  })

  return { code, expiresAt }
}

export async function consumeVerificationCode(
  userId: string,
  purpose: VerificationPurpose,
  channel: VerificationChannel,
  code: string
) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      purpose,
      channel,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record || !/^\d{6}$/.test(code) || !safeCodeEqual(code, record.codeHash)) {
    return false
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  })

  return true
}

export async function sendEmailCode(email: string, code: string, purpose: VerificationPurpose) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.VERIFICATION_EMAIL_FROM
  if (!apiKey || !from) throw new Error('Email verification provider is not configured')

  const subject = purpose === '2fa' ? 'Your PreLoved sign-in code' : 'Verify your PreLoved email'
  const label = purpose === '2fa' ? 'sign-in' : 'email verification'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text: `Your PreLoved ${label} code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes. If you did not request this, you can ignore this message.`,
    }),
  })

  if (!response.ok) throw new Error('Unable to send email verification code')
}

export async function sendSmsCode(phone: string, code: string, purpose: VerificationPurpose) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !from) throw new Error('SMS verification provider is not configured')

  const body = new URLSearchParams({
    From: from,
    To: normalizePhone(phone),
    Body: `PreLoved ${purpose === '2fa' ? 'sign-in' : 'verification'} code: ${code}. Expires in ${CODE_TTL_MINUTES} minutes.`,
  })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  )

  if (!response.ok) throw new Error('Unable to send SMS verification code')
}
