import assert from 'node:assert/strict'
import { test } from 'node:test'

// Route handlers call getServerSession, which needs a Next request scope.
// Swap the next-auth module in the CJS cache so each test controls the session.
let currentSession: unknown = null
const nextAuthPath = require.resolve('next-auth')
const originalNextAuth = require.cache[nextAuthPath]
require.cache[nextAuthPath] = {
  ...originalNextAuth,
  id: nextAuthPath,
  filename: nextAuthPath,
  loaded: true,
  exports: { getServerSession: async () => currentSession },
} as unknown as NodeJS.Module

// Must load after the cache swap above, so a hoisted import would bypass the mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DELETE } = require('../app/api/admin/listings/[id]/route') as typeof import('../app/api/admin/listings/[id]/route')

const context = { params: Promise.resolve({ id: 'listing-1' }) }
const request = () => new Request('http://localhost/api/admin/listings/listing-1', { method: 'DELETE' })

test('admin listing removal rejects anonymous requests', async () => {
  currentSession = null
  const res = await DELETE(request(), context)
  assert.equal(res.status, 401)
})

test('admin listing removal rejects non-admin users', async () => {
  currentSession = { user: { id: 'user-1', role: 'USER' } }
  const res = await DELETE(request(), context)
  assert.equal(res.status, 403)
})

test.after(() => {
  if (originalNextAuth) require.cache[nextAuthPath] = originalNextAuth
  else delete require.cache[nextAuthPath]
})
