'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Search, MapPin, Menu, X, Heart, Plus, User, LogOut } from 'lucide-react'
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (locationQuery) params.set('city', locationQuery)
    router.push(`/search?${params.toString()}`)
    setSearchOpen(false)
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[#0BA8A4] text-white py-2 text-center px-4">
        <p className="text-[11px] tracking-[0.2em] uppercase font-semibold">
          Everything is FREE Â· Community Pickup Â· No shipping, no fees
        </p>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 sm:px-6 lg:px-10">

          {/* Left: Hamburger + desktop nav links */}
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              className="text-gray-800 hover:text-black transition-colors flex-shrink-0"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.slice(0, 5).map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[11px] tracking-[0.15em] uppercase font-semibold text-gray-500 hover:text-black transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 flex-shrink-0"
          >
            <Heart className="w-4 h-4 text-[#0BA8A4] fill-[#0BA8A4]" />
            <span className="text-base font-black tracking-[0.3em] uppercase text-black whitespace-nowrap">
              PreLoved
            </span>
          </Link>

          {/* Right: Search icon + actions */}
          <div className="flex-1 flex items-center justify-end gap-1">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              className="p-2 text-gray-600 hover:text-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {session ? (
              <>
                <Link
                  href="/listings/new"
                  className="hidden sm:flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-4 py-2 text-[11px] tracking-[0.1em] uppercase font-bold transition-colors ml-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Item
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0BA8A4] flex items-center justify-center overflow-hidden">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {session.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-0.5 w-52 bg-white border border-gray-200 shadow-xl z-50">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{session.user?.email}</p>
                      </div>
                      <Link
                        href={`/profile/${session.user?.id}`}
                        className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-3.5 h-3.5" />
                        My Profile
                      </Link>
                      <Link
                        href="/listings/new"
                        className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 sm:hidden border-b border-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Post Item
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex items-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 ml-1">
                <Link
                  href="/login"
                  className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 hover:text-black px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 text-[11px] tracking-[0.1em] uppercase font-bold transition-colors"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Expandable search bar */}
        {searchOpen && (
          <div className="border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-10 py-3">
            <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto">
              <div className="flex-1 flex items-center border border-gray-300 focus-within:border-black transition-colors">
                <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="flex items-center border-y border-r border-gray-300 focus-within:border-black transition-colors w-36">
                <MapPin className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="City..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white px-6 text-[11px] tracking-[0.1em] uppercase font-bold transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="border-t border-gray-200 bg-white lg:hidden">
            <div className="px-4 py-4">
              {NAV_LINKS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-700 hover:text-black border-b border-gray-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                  <span className="text-gray-400 text-base">â€º</span>
                </Link>
              ))}
              {!session ? (
                <div className="pt-4 flex gap-3">
                  <Link
                    href="/login"
                    className="flex-1 border border-black text-center py-2.5 text-[11px] font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 bg-black text-white text-center py-2.5 text-[11px] font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Join Free
                  </Link>
                </div>
              ) : (
                <Link
                  href="/listings/new"
                  className="flex items-center justify-center gap-2 mt-4 bg-[#0BA8A4] text-white py-3 text-[11px] font-bold uppercase tracking-wide w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post a Free Item
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Click outside to close user menu */}
        {userMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
        )}
      </header>
    </>
  )
}


