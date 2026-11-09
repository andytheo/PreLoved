import assert from 'node:assert/strict'
import { test } from 'node:test'

// Swap modules in the CJS cache so route handlers run without Next request scope or a database.
let currentSession: unknown = null
let conversationLookup: unknown = null

function mockModule(specifier: string, exports: unknown) {
  const resolved = require.resolve(specifier)
  const original = require.cache[resolved]
  require.cache[resolved] = {
    ...original,
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  } as unknown as NodeJS.Module
  return () => {
    if (original) require.cache[resolved] = original
    else delete require.cache[resolved]
  }
}

const restoreNextAuth = mockModule('next-auth', { getServerSession: async () => currentSession })
const restorePrisma = mockModule('../lib/prisma', {
  prisma: {
    conversation: { findUnique: async () => conversationLookup },
    message: { create: async () => ({ id: 'm1' }) },
  },
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require('../app/api/conversations/[id]/messages/route') as typeof import('../app/api/conversations/[id]/messages/route')

const context = { params: Promise.resolve({ id: 'conv-1' }) }
const postMessage = (body: unknown) =>
  new Request('http://localhost/api/conversations/conv-1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

test('sending a message rejects anonymous requests', async () => {
  currentSession = null
  const res = await POST(postMessage({ body: 'hi' }), context)
  assert.equal(res.status, 401)
})

test('sending a message rejects unverified users', async () => {
  currentSession = { user: { id: 'user-1', role: 'USER', emailVerified: false } }
  const res = await POST(postMessage({ body: 'hi' }), context)
  assert.equal(res.status, 403)
})

test('sending a message rejects empty bodies', async () => {
  currentSession = { user: { id: 'user-1', role: 'USER', emailVerified: true } }
  const res = await POST(postMessage({ body: '   ' }), context)
  assert.equal(res.status, 400)
})

test('sending a message returns 404 for non-participants', async () => {
  currentSession = { user: { id: 'outsider', role: 'USER', emailVerified: true } }
  conversationLookup = null
  const res = await POST(postMessage({ body: 'hi' }), context)
  assert.equal(res.status, 404)
})

test.after(() => {
  restoreNextAuth()
  restorePrisma()
})
