import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isConversationParticipant, messageBodySchema, MESSAGE_MAX_LENGTH } from '../lib/messaging'

test('message body must be trimmed and within the length limit', () => {
  assert.equal(messageBodySchema.safeParse({ body: '   ' }).success, false)
  assert.equal(messageBodySchema.safeParse({ body: 'a'.repeat(MESSAGE_MAX_LENGTH + 1) }).success, false)
  assert.equal(messageBodySchema.safeParse({ body: 'a'.repeat(MESSAGE_MAX_LENGTH) }).success, true)

  const parsed = messageBodySchema.safeParse({ body: '  hello  ' })
  assert.equal(parsed.success && parsed.data.body, 'hello')
})

test('only the buyer and seller are conversation participants', () => {
  const conversation = { buyerId: 'buyer', sellerId: 'seller' }
  assert.equal(isConversationParticipant(conversation, 'buyer'), true)
  assert.equal(isConversationParticipant(conversation, 'seller'), true)
  assert.equal(isConversationParticipant(conversation, 'stranger'), false)
})
