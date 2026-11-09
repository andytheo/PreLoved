import assert from 'node:assert/strict'
import { test } from 'node:test'

// Same next-auth cache swap as admin-routes.test.ts: route handlers need a Next request scope.
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
const { PATCH } = require('../app/api/admin/reports/[id]/route') as typeof import('../app/api/admin/reports/[id]/route')

const context = { params: Promise.resolve({ id: 'report-1' }) }
const request = (body: unknown) =>
  new Request('http://localhost/api/admin/reports/report-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

test('report triage rejects anonymous requests', async () => {
  currentSession = null
  const res = await PATCH(request({ status: 'RESOLVED' }), context)
  assert.equal(res.status, 401)
})

test('report triage rejects non-admin users', async () => {
  currentSession = { user: { id: 'user-1', role: 'USER' } }
  const res = await PATCH(request({ status: 'RESOLVED' }), context)
  assert.equal(res.status, 403)
})

test('report triage rejects statuses outside the allowed set', async () => {
  currentSession = { user: { id: 'admin-1', role: 'ADMIN' } }
  const res = await PATCH(request({ status: 'OPEN' }), context)
  assert.equal(res.status, 400)
})

test.after(() => {
  if (originalNextAuth) require.cache[nextAuthPath] = originalNextAuth
  else delete require.cache[nextAuthPath]
})
