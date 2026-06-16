import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import EditListingForm from '@/components/listings/EditListingForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) notFound()
  if (listing.userId !== session.user.id) redirect('/')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <EditListingForm listing={listing} />
    </div>
  )
}
