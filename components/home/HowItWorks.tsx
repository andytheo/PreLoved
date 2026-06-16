import Link from 'next/link'
import { Camera, MapPin, Handshake } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    { icon: <Camera className="w-5 h-5" />, number: '01', title: 'Post Your Item', description: 'Take a photo and post any item you no longer need. Clothes, furniture, electronics — anything goes.' },
    { icon: <MapPin className="w-5 h-5" />, number: '02', title: 'Someone Nearby Finds It', description: 'People in your community browse items available near them and find exactly what they need.' },
    { icon: <Handshake className="w-5 h-5" />, number: '03', title: 'Arrange Free Pickup', description: 'Connect with the person and arrange a convenient time for them to pick it up. Zero cost, zero hassle.' },
  ]

  return (
    <section className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#0BA8A4] mb-2">Simple Process</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">How PreLoved Works</h2>
          </div>
          <Link href="/register" className="hidden sm:inline-flex items-center gap-2 bg-[#0BA8A4] hover:bg-[#099a97] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors">
            Start Giving Today
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
          {steps.map((step, i) => (
            <div key={i} className="bg-black p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[#0BA8A4]">{step.icon}</span>
                <span className="text-5xl font-black text-white/10">{step.number}</span>
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white mb-3">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#0BA8A4] hover:bg-[#099a97] text-white px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors">
            Start Giving Today
          </Link>
        </div>
      </div>
    </section>
  )
}
