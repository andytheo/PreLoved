'use client'

import { CATEGORIES } from '@/lib/categories'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CategorySection() {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category') ?? ''

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <Link
        href="/search"
        className={`flex-shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] border transition-colors ${
          !currentCategory
            ? 'bg-black text-white border-black'
            : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black'
        }`}
      >
        All Items
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.id}`}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] border transition-colors ${
            currentCategory === cat.id
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-300 hover:border-black hover:text-black'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}

