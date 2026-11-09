import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      buyerId: true,
      listing: { select: { title: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, senderId: true } },
    },
  })

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-gray-600">
          No conversations yet. Message a seller from a listing to start one.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
          {conversations.map((conversation) => {
            const isBuyer = conversation.buyerId === userId
            const otherName = isBuyer ? conversation.seller.name : conversation.buyer.name
            const latest = conversation.messages[0]
            return (
              <li key={conversation.id}>
                <Link href={`/messages/${conversation.id}`} className="block px-4 py-4 hover:bg-gray-50">
                  <p className="font-medium text-gray-900">{conversation.listing.title}</p>
                  <p className="text-sm text-gray-600">
                    {isBuyer ? 'Seller' : 'Buyer'}: {otherName}
                  </p>
                  {latest && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {latest.senderId === userId ? 'You: ' : ''}
                      {latest.body}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
