import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-teal-800 text-white mt-20">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-5">
                <Heart className="w-4 h-4 text-white fill-white" />
                <span className="text-sm font-black tracking-[0.3em] uppercase">PreLoved</span>
              </Link>
              <p className="text-xs text-teal-200 leading-relaxed max-w-xs">
                Give your items a second life. Share what you no longer need with your community — completely free.
              </p>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-teal-300 mb-4">Browse</h3>
              <ul className="space-y-2.5">
                {[
                  ['Furniture', '/search?category=furniture'],
                  ['Clothing', '/search?category=clothing'],
                  ['Electronics', '/search?category=electronics'],
                  ['Books', '/search?category=books'],
                  ['All Categories', '/search'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-teal-100/80 hover:text-white transition-colors tracking-wide">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-teal-300 mb-4">Account</h3>
              <ul className="space-y-2.5">
                {[
                  ['Create Account', '/register'],
                  ['Sign In', '/login'],
                  ['Post an Item', '/listings/new'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-teal-100/80 hover:text-white transition-colors tracking-wide">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-teal-300 mb-4">Our Promise</h3>
              <ul className="space-y-2.5">
                <li className="text-xs text-teal-100/80 tracking-wide">100% Free to use</li>
                <li className="text-xs text-teal-100/80 tracking-wide">No shipping fees</li>
                <li className="text-xs text-teal-100/80 tracking-wide">Local community first</li>
                <li className="text-xs text-teal-100/80 tracking-wide">hello@preloved.app</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-teal-900 max-w-full px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-teal-300 tracking-wide">
            © {new Date().getFullYear()} PreLoved. Giving items a second life.
          </p>
          <p className="text-[11px] text-teal-300 flex items-center gap-1.5 tracking-wide">
            Made with <Heart className="w-3 h-3 text-white fill-white" /> for communities everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
