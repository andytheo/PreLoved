import { NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit'

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
})

export async function POST(req: Request) {
  try {
    const parsed = contactSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the form and try again.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const rateLimit = await consumeRateLimit(
      'contact',
      requestIdentity(req, parsed.data.email),
      5,
      60 * 60 * 1000
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.CONTACT_EMAIL_FROM || process.env.VERIFICATION_EMAIL_FROM
    const to = process.env.CONTACT_EMAIL_TO
    if (!apiKey || !from || !to) {
      console.error('Contact email provider is not configured')
      return NextResponse.json({ error: 'Contact email is temporarily unavailable.' }, { status: 503 })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: parsed.data.email,
        subject: `[PreLoved] ${parsed.data.subject}`,
        text: [
          `From: ${parsed.data.name} <${parsed.data.email}>`,
          '',
          parsed.data.message,
        ].join('\n'),
      }),
    })

    if (!response.ok) {
      console.error('Resend contact delivery failed', response.status, await response.text())
      return NextResponse.json({ error: 'We could not send your message. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact request failed', error)
    return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 500 })
  }
}
