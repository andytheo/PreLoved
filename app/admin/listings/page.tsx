import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import RemoveListingButton from '@/components/admin/RemoveListingButton'

export const dynamic = 'force-dynamic'

export default async function AdminListingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      category: true,
      city: true,
      isAvailable: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  })

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-emerald-300 hover:underline">Back to admin</Link>
        <h1 className="mt-4 mb-6 text-3xl font-black tracking-tight">Listings</h1>
        <p className="mb-4 text-sm text-slate-400">Showing the 200 most recent listings.</p>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-4 py-3">
                    <Link href={`/listings/${listing.id}`} className="hover:text-emerald-300">
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {listing.user.name}
                    <span className="block text-xs text-slate-500">{listing.user.email}</span>
                  </td>
                  <td className="px-4 py-3">{listing.category}</td>
                  <td className="px-4 py-3">{listing.city}</td>
                  <td className="px-4 py-3">{listing.isAvailable ? 'Available' : 'Unavailable'}</td>
                  <td className="px-4 py-3 text-slate-400">{listing.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <RemoveListingButton listingId={listing.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
