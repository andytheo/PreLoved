'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=80',
    credit: 'Artificial Photography',
    creditUrl: 'https://unsplash.com/@artificialartifice',
    label: '100% Free · Community First',
    headline: ['Give Your', 'Items A', 'Second Life'],
    tealWord: 2,
  },
  {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=80',
    credit: 'Kam Idris',
    creditUrl: 'https://unsplash.com/@kamiceri',
    label: 'Furniture & Home',
    headline: ['Quality', 'Furniture', 'For Free'],
    tealWord: 2,
  },
  {
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80',
    credit: 'Kimberly Farmer',
    creditUrl: 'https://unsplash.com/@kimberlyfarmer',
    label: 'Books & More',
    headline: ['Share What', 'You No', 'Longer Need'],
    tealWord: 2,
  },
]

interface HeroCarouselProps {
  hasSession: boolean
}

export default function HeroCarousel({ hasSession }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (idx === current) return
    setFading(true)
    setTimeout(() => {
      setCurrent(idx)
      setFading(false)
    }, 400)
  }, [current])

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length)
  }, [current, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length)
  }, [current, goTo])

  useEffect(() => {
    const timer = setInterval(next, 5500)
    return () => clearInterval(timer)
  }, [next])

  const slide = SLIDES[current]

  return (
    <section className="relative bg-black text-white overflow-hidden min-h-[580px] md:min-h-[680px]">
      {/* Background images — crossfade */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: i === current ? 1 : 0,
          }}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ))}

      {/* Content */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 md:py-32"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
      >
        <div className="max-w-2xl">
          <p className="text-[11px] tracking-[0.35em] uppercase font-bold text-[#0BA8A4] mb-5">
            {slide.label}
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.95] mb-7 tracking-tight">
            {slide.headline[0]}<br />
            {slide.headline[1]}<br />
            <span className="text-[#0BA8A4]">{slide.headline[2]}</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed">
            Find free items in your neighbourhood. Clothes, furniture, electronics — completely free to pick up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#0BA8A4] hover:bg-[#099a97] text-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors"
            >
              Browse Items Near Me
            </Link>
            <Link
              href={hasSession ? '/listings/new' : '/register'}
              className="inline-flex items-center justify-center gap-2 border border-white text-white hover:bg-white hover:text-black px-8 py-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors"
            >
              Post a Free Item
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 transition-all duration-300 ${
              i === current ? 'bg-[#0BA8A4] w-7' : 'bg-white/40 w-1.5 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Photo credit — bottom right */}
      <div className="absolute bottom-5 right-4 z-20">
        <p className="text-[9px] text-white/30 hover:text-white/60 transition-colors tracking-wide">
          Photo by{' '}
          <a
            href={slide.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            {slide.credit}
          </a>{' '}
          on Unsplash
        </p>
      </div>
    </section>
  )
}
