import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

// Runs only against a disposable database (e.g. the local preloved-dev-pg container).
// It never falls back to DATABASE_URL, so Neon cannot be touched by accident.
const testDatabaseUrl = process.env.TEST_DATABASE_URL
const suite = testDatabaseUrl ? test : test.skip

let currentSession: unknown = null

function mockNextAuth() {
  const resolved = require.resolve('next-auth')
  const original = require.cache[resolved]
  require.cache[resolved] = {
    ...original,
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: { getServerSession: async () => currentSession },
  } as unknown as NodeJS.Module
  return () => {
    if (original) require.cache[resolved] = original
    else delete require.cache[resolved]
  }
}

const restoreNextAuth = mockNextAuth()
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl

/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require('../lib/prisma') as typeof import('../lib/prisma')
const conversationsRoute = require('../app/api/conversations/route') as typeof import('../app/api/conversations/route')
const threadRoute = require('../app/api/conversations/[id]/route') as typeof import('../app/api/conversations/[id]/route')
const messageRoute = require('../app/api/conversations/[id]/messages/route') as typeof import('../app/api/conversations/[id]/messages/route')
const adminListingRoute = require('../app/api/admin/listings/[id]/route') as typeof import('../app/api/admin/listings/[id]/route')
/* eslint-enable @typescript-eslint/no-require-imports */

const RUN = `dbtest${Date.now()}`
const domain = `${RUN}.db-test.local`
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const jsonReq = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

let seller: { id: string }
let buyer: { id: string }
let outsider: { id: string }
let adminUser: { id: string }
let listing: { id: string }

before(async () => {
  if (!testDatabaseUrl) return
  const verified = { emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() }
  const mk = (name: string, role = 'USER') =>
    prisma.user.create({
      data: { name, email: `${name}@${domain}`, password: 'not-used', role, ...verified },
      select: { id: true },
    })
  seller = await mk('seller')
  buyer = await mk('buyer')
  outsider = await mk('outsider')
  adminUser = await mk('admin', 'ADMIN')
  listing = await prisma.listing.create({
    data: {
      title: 'Free desk',
      description: 'Solid wood desk',
      category: 'furniture',
      city: 'Testville',
      userId: seller.id,
    },
    select: { id: true },
  })
})

after(async () => {
  restoreNextAuth()
  if (!testDatabaseUrl) return
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${domain}` } } })
  await prisma.$disconnect()
})

suite('creating a conversation returns the existing one on repeat (DB)', async () => {
  currentSession = { user: { id: buyer.id, role: 'USER', emailVerified: true } }
  const first = await conversationsRoute.POST(jsonReq('http://localhost/api/conversations', 'POST', { listingId: listing.id }))
  assert.equal(first.status, 201)
  const { id } = (await first.json()) as { id: string }

  const again = await conversationsRoute.POST(jsonReq('http://localhost/api/conversations', 'POST', { listingId: listing.id }))
  assert.equal(again.status, 200)
  assert.equal(((await again.json()) as { id: string }).id, id)

  const rows = await prisma.conversation.count({ where: { listingId: listing.id, buyerId: buyer.id } })
  assert.equal(rows, 1)
})

suite('a buyer can send a message and the participants can read the thread (DB)', async () => {
  const conversation = await prisma.conversation.findFirstOrThrow({
    where: { listingId: listing.id, buyerId: buyer.id },
    select: { id: true },
  })

  currentSession = { user: { id: buyer.id, role: 'USER', emailVerified: true } }
  const sent = await messageRoute.POST(
    jsonReq(`http://localhost/api/conversations/${conversation.id}/messages`, 'POST', { body: '  Is it still available?  ' }),
    ctx(conversation.id),
  )
  assert.equal(sent.status, 201)
  const message = (await sent.json()) as { body: string; senderId: string }
  assert.equal(message.body, 'Is it still available?')
  assert.equal(message.senderId, buyer.id)

  currentSession = { user: { id: seller.id, role: 'USER', emailVerified: true } }
  const thread = await threadRoute.GET(new Request('http://localhost/api'), ctx(conversation.id))
  assert.equal(thread.status, 200)
  const body = (await thread.json()) as { messages: { body: string }[] }
  assert.ok(body.messages.some((m) => m.body === 'Is it still available?'))
})

suite('non-participants cannot read or write a thread (DB)', async () => {
  const conversation = await prisma.conversation.findFirstOrThrow({
    where: { listingId: listing.id, buyerId: buyer.id },
    select: { id: true },
  })
  currentSession = { user: { id: outsider.id, role: 'USER', emailVerified: true } }

  const read = await threadRoute.GET(new Request('http://localhost/api'), ctx(conversation.id))
  assert.equal(read.status, 404)

  const write = await messageRoute.POST(
    jsonReq(`http://localhost/api/conversations/${conversation.id}/messages`, 'POST', { body: 'hi' }),
    ctx(conversation.id),
  )
  assert.equal(write.status, 404)
  assert.equal(await prisma.message.count({ where: { senderId: outsider.id } }), 0)
})

suite('an admin can remove a listing and a second removal reports not found (DB)', async () => {
  currentSession = { user: { id: adminUser.id, role: 'ADMIN', emailVerified: true } }

  const removed = await adminListingRoute.DELETE(new Request('http://localhost/api'), ctx(listing.id))
  assert.equal(removed.status, 200)
  assert.equal(await prisma.listing.count({ where: { id: listing.id } }), 0)

  const again = await adminListingRoute.DELETE(new Request('http://localhost/api'), ctx(listing.id))
  assert.equal(again.status, 404)
})
