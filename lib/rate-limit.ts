import { createHmac } from 'crypto'
import { prisma } from './prisma'

function keySecret() {
  const value = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET
  if (!value) throw new Error('RATE_LIMIT_SECRET or NEXTAUTH_SECRET must be configured')
  return value
}

function hashKey(scope: string, identity: string) {
  return createHmac('sha256', keySecret()).update(`${scope}:${identity}`).digest('hex')
}

export function requestIdentity(req: Request, secondary = '') {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  const network = forwarded || realIp || 'unknown'
  return `${network}|${secondary.toLowerCase().trim()}`
}

export async function consumeRateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const key = hashKey(scope, identity)
  const now = new Date()
  const resetAt = new Date(Date.now() + windowMs)

  return prisma.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { key } })

    if (!bucket) {
      await tx.rateLimitBucket.create({ data: { key, count: 1, resetAt } })
      return { allowed: true, retryAfter: 0 }
    }

    if (bucket.resetAt <= now) {
      await tx.rateLimitBucket.update({ where: { key }, data: { count: 1, resetAt } })
      return { allowed: true, retryAfter: 0 }
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((bucket.resetAt.getTime() - Date.now()) / 1000)),
      }
    }

    await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } })
    return { allowed: true, retryAfter: 0 }
  })
}
