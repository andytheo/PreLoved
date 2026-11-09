import assert from 'node:assert/strict'
import { test } from 'node:test'
import { POST } from '../app/api/auth/email-verification/confirm/route'
import { prisma } from '../lib/prisma'

test('verification requires a token and consumes only an unexpired matching token', async () => {
  const original = prisma.user.updateMany
  const calls: unknown[] = []
  let count = 1
  Object.defineProperty(prisma.user, 'updateMany', {
    configurable: true,
    value: async (args: unknown) => {
      calls.push(args)
      return { count }
    },
  })

  try {
    const request = (token?: string) => new Request('http://localhost/api/auth/email-verification/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    assert.equal((await POST(request())).status, 400)
    assert.equal(calls.length, 0)
    assert.equal((await POST(request('test-token'))).status, 200)
    assert.equal(calls.length, 1)
    const args = calls[0] as {
      where: { emailVerificationToken: string; emailVerificationTokenExpires: { gt: Date } }
      data: { emailVerified: boolean; emailVerificationToken: null; emailVerificationTokenExpires: null }
    }
    assert.equal(args.where.emailVerificationToken, 'test-token')
    assert.ok(args.where.emailVerificationTokenExpires.gt instanceof Date)
    assert.deepEqual(args.data, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    })
    count = 0
    assert.equal((await POST(request('test-token'))).status, 400)
  } finally {
    Object.defineProperty(prisma.user, 'updateMany', { configurable: true, value: original })
  }
})

test('registration keeps the account unverified and reports email delivery failure', async () => {
  const originalKey = process.env.SENDGRID_API_KEY
  process.env.SENDGRID_API_KEY = ''
  const { POST: register } = await import('../app/api/auth/register/route')
  const originalFind = prisma.user.findUnique
  const originalCreate = prisma.user.create
  let created: { data: { emailVerified: boolean; emailVerificationToken: string } } | undefined
  Object.defineProperty(prisma.user, 'findUnique', {
    configurable: true,
    value: async () => null,
  })
  Object.defineProperty(prisma.user, 'create', {
    configurable: true,
    value: async (args: typeof created) => {
      created = args
      return { id: 'user-id', name: 'Test User', email: 'test@example.com' }
    },
  })
  try {
    const response = await register(new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
        city: 'Toronto',
      }),
    }))
    assert.equal(response.status, 201)
    assert.equal((await response.json()).verificationEmailSent, false)
    assert.equal(created?.data.emailVerified, false)
    assert.match(created?.data.emailVerificationToken ?? '', /^[a-f0-9]{64}$/)
  } finally {
    Object.defineProperty(prisma.user, 'findUnique', { configurable: true, value: originalFind })
    Object.defineProperty(prisma.user, 'create', { configurable: true, value: originalCreate })
    if (originalKey === undefined) delete process.env.SENDGRID_API_KEY
    else process.env.SENDGRID_API_KEY = originalKey
  }
})
