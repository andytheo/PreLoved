import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  password: z.string().min(1),
  confirmation: z.literal('DELETE'),
})

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Type DELETE and enter your password to confirm' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const matches = await bcrypt.compare(parsed.data.password, user.password)
    if (!matches) return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })

    await prisma.user.delete({ where: { id: user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unable to delete account' }, { status: 500 })
  }
}
