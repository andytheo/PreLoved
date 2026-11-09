import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isConversationParticipant } from '@/lib/messaging'
import MessageForm from '@/components/messages/MessageForm'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function ConversationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params
  const userId = session.user.id
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      listing: { select: { title: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  })

  if (!conversation || !isConversationParticipant(conversation, userId)) {
    notFound()
  }

  const isBuyer = conversation.buyerId === userId

  const otherName = isBuyer ? conversation.seller.name : conversation.buyer.name

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <p className="text-sm text-gray-500 mb-1">
        <Link href="/messages" className="hover:underline">Messages</Link> / {conversation.listing.title}
      </p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Conversation with {otherName}
      </h1>

      <div className="space-y-3 mb-6">
        {conversation.messages.length === 0 && (
          <p className="text-gray-600">No messages yet.</p>
        )}
        {conversation.messages.map((message) => {
          const mine = message.senderId === userId
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                  mine ? 'bg-[#0BA8A4] text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.body}</p>
                <p className={`text-[11px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>
                  {message.createdAt.toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {session.user.emailVerified ? (
        <MessageForm conversationId={conversation.id} />
      ) : (
        <p className="text-sm text-gray-700">
          <Link href="/verify-email" className="underline">Verify your email</Link> to send messages.
        </p>
      )}
    </main>
  )
}
