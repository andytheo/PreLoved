'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  Bell,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  ['Browse All', '/search'],
  ['Clothing', '/search?category=clothing'],
  ['Furniture', '/search?category=furniture'],
  ['Electronics', '/search?category=electronics'],
  ['Books', '/search?category=books'],
  ['Toys & Kids', '/search?category=toys'],
]

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (locationQuery.trim()) params.set('city', locationQuery.trim())
    router.push(`/search?${params.toString()}`)
    setSearchOpen(false)
  }

  const closeUserMenu = () => setUserMenuOpen(false)

  return (
    <>
      <div className="bg-[#0BA8A4] px-3 py-2 text-center text-white sm:px-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.2em]">
          Everything is free · Community pickup · No shipping, no fees
        </p>
      </div>

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center px-3 sm:px-6 lg:px-10">
          <div className="flex flex-1 items-center gap-6">
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="flex-shrink-0 text-gray-800 transition-colors hover:text-black">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <nav className="hidden items-center gap-6 lg:flex">
              {NAV_LINKS.slice(0, 5).map(([label, href]) => (
                <Link key={href} href={href} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 transition-colors hover:text-black">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" aria-label="PreLoved home" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 sm:gap-2.5">
            <Heart className="h-4 w-4 fill-[#0BA8A4] text-[#0BA8A4]" />
            <span className="hidden whitespace-nowrap text-sm font-black uppercase tracking-[0.2em] text-black min-[390px]:inline sm:text-base sm:tracking-[0.3em]">PreLoved</span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" className="p-2 text-gray-600 transition-colors hover:text-black">
              <Search className="h-5 w-5" />
            </button>

            {session ? (
              <>
                <Link href="/notifications" aria-label="Notifications" className="hidden p-2 text-gray-600 transition-colors hover:text-black min-[420px]:block">
                  <Bell className="h-5 w-5" />
                </Link>
                <Link href="/listings/new" className="ml-1 hidden items-center gap-1.5 bg-black px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-gray-800 sm:flex">
                  <Plus className="h-3.5 w-3.5" /> Post Item
                </Link>

                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="Open account menu" className="p-2 transition-colors hover:bg-gray-50">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#0BA8A4]">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{session.user?.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 z-50 mt-0.5 w-56 border border-gray-200 bg-white shadow-xl">
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-900">{session.user?.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      <Link href={`/profile/${session.user?.id}`} onClick={closeUserMenu} className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50"><User className="h-3.5 w-3.5" /> My Profile</Link>
                      <Link href="/notifications" onClick={closeUserMenu} className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50"><Bell className="h-3.5 w-3.5" /> Notifications</Link>
                      <Link href="/settings/security" onClick={closeUserMenu} className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50"><ShieldCheck className="h-3.5 w-3.5" /> Security</Link>
                      <Link href="/settings/account" onClick={closeUserMenu} className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50"><Settings className="h-3.5 w-3.5" /> Account</Link>
                      <Link href="/listings/new" onClick={closeUserMenu} className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 sm:hidden"><Plus className="h-3.5 w-3.5" /> Post Item</Link>
                      <button onClick={() => { closeUserMenu(); signOut({ callbackUrl: '/' }) }} className="flex w-full items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50"><LogOut className="h-3.5 w-3.5" /> Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="ml-1 flex items-center gap-1">
                <Link href="/login" className="hidden px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 transition-colors hover:text-black sm:block">Sign In</Link>
                <Link href="/register" className="bg-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-gray-800 sm:px-4 sm:text-[11px] sm:tracking-[0.1em]">Join Free</Link>
              </div>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200 bg-white px-3 py-3 sm:px-6 lg:px-10">
            <form onSubmit={handleSearch} className="mx-auto grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
              <div className="flex items-center border border-gray-300 transition-colors focus-within:border-black">
                <Search className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                <input type="text" placeholder="Search items..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} autoFocus className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
              </div>
              <div className="flex items-center border border-gray-300 transition-colors focus-within:border-black">
                <MapPin className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                <input type="text" placeholder="City or region..." value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
              </div>
              <button type="submit" className="bg-black px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-gray-800">Search</button>
            </form>
          </div>
        )}

        {menuOpen && (
          <div className="border-t border-gray-200 bg-white lg:hidden">
            <div className="px-4 py-4">
              {NAV_LINKS.map(([label, href]) => (
                <Link key={href} href={href} className="flex items-center justify-between border-b border-gray-100 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-700 transition-colors hover:text-black" onClick={() => setMenuOpen(false)}>
                  {label}<span className="text-base text-gray-400">›</span>
                </Link>
              ))}
              {!session ? (
                <div className="flex gap-3 pt-4">
                  <Link href="/login" className="flex-1 border border-black py-2.5 text-center text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-black hover:text-white" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" className="flex-1 bg-black py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-gray-800" onClick={() => setMenuOpen(false)}>Join Free</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Link href="/notifications" className="border border-gray-300 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide" onClick={() => setMenuOpen(false)}>Notifications</Link>
                  <Link href="/settings/security" className="border border-gray-300 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide" onClick={() => setMenuOpen(false)}>Security</Link>
                  <Link href="/listings/new" className="col-span-2 flex items-center justify-center gap-2 bg-[#0BA8A4] py-3 text-[11px] font-bold uppercase tracking-wide text-white" onClick={() => setMenuOpen(false)}><Plus className="h-3.5 w-3.5" /> Post a Free Item</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {userMenuOpen && <div className="fixed inset-0 z-40" onClick={closeUserMenu} />}
      </header>
    </>
  )
}
