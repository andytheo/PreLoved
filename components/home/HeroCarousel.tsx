'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=80',
    credit: 'Artificial Photography',
    creditUrl: 'https://unsplash.com/@artificialartifice',
    label: '100% Free · Community First',
    headline: ['Give Your', 'Items A', 'Second Life'],
  },
  {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=80',
    credit: 'Kam Idris',
    creditUrl: 'https://unsplash.com/@kamiceri',
    label: 'Furniture & Home',
    headline: ['Quality', 'Furniture', 'For Free'],
  },
  {
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80',
    credit: 'Kimberly Farmer',
    creditUrl: 'https://unsplash.com/@kimberlyfarmer',
    label: 'Books & More',
    headline: ['Share What', 'You No', 'Longer Need'],
  },
]

export default function HeroCarousel({ hasSession }: { hasSession: boolean }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((index: number) => {
    if (index === current) return
    setFading(true)
    window.setTimeout(() => {
      setCurrent(index)
      setFading(false)
    }, 300)
  }, [current])

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo])
  const previous = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo])

  useEffect(() => {
    const timer = window.setInterval(next, 5500)
    return () => window.clearInterval(timer)
  }, [next])

  const slide = SLIDES[current]

  return (
    <section className="relative min-h-[500px] overflow-hidden bg-black text-white sm:min-h-[560px] md:min-h-[650px]">
      {SLIDES.map((item, index) => (
        <div
          key={item.image}
          className="absolute inset-0"
          style={{
            opacity: index === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: index === current ? 1 : 0,
          }}
        >
          <img src={item.image} alt="" className="h-full w-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-black/60 sm:bg-black/55" />
        </div>
      ))}

      <div
        className="relative z-10 mx-auto max-w-7xl px-8 py-16 sm:px-10 sm:py-20 md:px-12 md:py-28 lg:px-16"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
      >
        <div className="max-w-2xl">
          <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-[#0BA8A4] sm:mb-5 sm:text-[11px] sm:tracking-[0.35em]">
            {slide.label}
          </p>
          <h1 className="mb-6 text-4xl font-black uppercase leading-[0.95] tracking-tight min-[380px]:text-5xl md:mb-7 md:text-7xl">
            {slide.headline[0]}<br />
            {slide.headline[1]}<br />
            <span className="text-[#0BA8A4]">{slide.headline[2]}</span>
          </h1>
          <p className="mb-7 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base md:mb-8 md:text-lg">
            Find free items in your area, from furniture and clothes to electronics and books.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className="inline-flex items-center justify-center gap-2 bg-[#0BA8A4] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#099a97] sm:px-8 sm:py-4 sm:text-[11px] sm:tracking-[0.15em]">
              Browse Items Near Me
            </Link>
            <Link href={hasSession ? '/listings/new' : '/register'} className="inline-flex items-center justify-center gap-2 border border-white px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black sm:px-8 sm:py-4 sm:text-[11px] sm:tracking-[0.15em]">
              Post a Free Item <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <button onClick={previous} aria-label="Previous slide" className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-3 sm:h-10 sm:w-10">
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button onClick={next} aria-label="Next slide" className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-3 sm:h-10 sm:w-10">
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
        {SLIDES.map((item, index) => (
          <button
            key={item.image}
            onClick={() => goTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-1.5 transition-all duration-300 ${index === current ? 'w-7 bg-[#0BA8A4]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>

      <p className="absolute bottom-5 right-4 z-20 hidden text-[9px] tracking-wide text-white/40 transition-colors hover:text-white/70 sm:block">
        Photo by{' '}
        <a href={slide.creditUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/90">
          {slide.credit}
        </a>{' '}
        on Unsplash
      </p>
    </section>
  )
}
