import Link from 'next/link'
import { Heart, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 bg-teal-800 text-white sm:mt-20">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Link href="/" className="mb-5 flex items-center gap-2">
                <Heart className="h-4 w-4 fill-white text-white" />
                <span className="text-sm font-black uppercase tracking-[0.3em]">PreLoved</span>
              </Link>
              <p className="max-w-xs text-xs leading-relaxed text-teal-200">
                Give useful items a second life. Find and share free things with people in your local area, wherever you live.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Browse</h2>
              <ul className="space-y-2.5">
                {[
                  ['Furniture', '/search?category=furniture'],
                  ['Clothing', '/search?category=clothing'],
                  ['Electronics', '/search?category=electronics'],
                  ['Books', '/search?category=books'],
                  ['All Categories', '/search'],
                ].map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-xs tracking-wide text-teal-100/80 transition-colors hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Account</h2>
              <ul className="space-y-2.5">
                {[
                  ['Create Account', '/register'],
                  ['Sign In', '/login'],
                  ['Post an Item', '/listings/new'],
                  ['Security', '/settings/security'],
                ].map(([label, href]) => (
                  <li key={href}><Link href={href} className="text-xs tracking-wide text-teal-100/80 transition-colors hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">Help & Safety</h2>
              <ul className="space-y-2.5">
                <li className="text-xs tracking-wide text-teal-100/80">100% free to use</li>
                <li className="text-xs tracking-wide text-teal-100/80">Local pickup</li>
                <li className="text-xs tracking-wide text-teal-100/80">Exact pickup details stay private</li>
                <li>
                  <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white hover:underline">
                    <Mail className="h-3.5 w-3.5" /> Contact PreLoved
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-teal-900 px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] tracking-wide text-teal-300">© {new Date().getFullYear()} PreLoved. Giving items a second life.</p>
          <p className="flex items-center gap-1.5 text-[11px] tracking-wide text-teal-300">Made with <Heart className="h-3 w-3 fill-white text-white" /> for communities everywhere</p>
        </div>
      </div>
    </footer>
  )
}
