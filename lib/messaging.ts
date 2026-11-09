import { z } from 'zod'

export const MESSAGE_MAX_LENGTH = 2000

export const messageBodySchema = z.object({
  body: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
})

export function isConversationParticipant(
  conversation: { buyerId: string; sellerId: string },
  userId: string
): boolean {
  return conversation.buyerId === userId || conversation.sellerId === userId
}
