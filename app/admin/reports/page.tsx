import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ReportActionButtons from '@/components/admin/ReportActionButtons'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  const reports = await prisma.report.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      reason: true,
      details: true,
      createdAt: true,
      reporter: { select: { name: true, email: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
  })

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-emerald-300 hover:underline">Back to admin</Link>
        <h1 className="mt-4 mb-6 text-3xl font-black tracking-tight">Open reports</h1>
        <p className="mb-4 text-sm text-slate-400">Showing up to 200 open reports, newest first.</p>

        {reports.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">No open reports.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reported user</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Filed</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{report.reason}</span>
                      {report.details && (
                        <span className="block max-w-xs whitespace-pre-wrap text-xs text-slate-400">{report.details}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {report.reportedUser ? (
                        <>
                          {report.reportedUser.name}
                          <span className="block text-xs text-slate-500">{report.reportedUser.email}</span>
                        </>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {report.listing ? (
                        <Link href={`/listings/${report.listing.id}`} className="hover:text-emerald-300">
                          {report.listing.title}
                        </Link>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {report.reporter.name}
                      <span className="block text-xs text-slate-500">{report.reporter.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{report.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <ReportActionButtons reportId={report.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
