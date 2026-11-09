import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  const [totalUsers, totalListings, verifiedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null }, phoneVerifiedAt: { not: null } } }),
  ])

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Operations</p>
            <h1 className="text-3xl font-black tracking-tight">PreLoved Admin</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
          >
            View storefront
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total users" value={String(totalUsers)} accent="emerald" />
          <StatCard title="Total listings" value={String(totalListings)} accent="cyan" />
          <StatCard title="Verified users" value={String(verifiedUsers)} accent="violet" />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin controls</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <PanelLink href="/admin/users" label="Manage users" />
            <PanelLink href="/admin/listings" label="Review listings" />
            <PanelLink href="/admin/reports" label="Review reports" />
            <PanelLink href="/" label="View marketplace" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string
  value: string
  accent: 'emerald' | 'cyan' | 'violet'
}) {
  const tone = {
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  }[accent]

  return (
    <div className={`rounded-2xl border ${tone} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">{title}</p>
      <p className="mt-4 text-3xl font-black">{value}</p>
    </div>
  )
}

function PanelLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
    >
      {label}
    </a>
  )
}
