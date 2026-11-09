'use client'

import { useState } from 'react'
import { Loader2, Mail, Send } from 'lucide-react'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setStatus('sending')

    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error || 'We could not send your message.')
        setStatus('idle')
        return
      }
      form.reset()
      setStatus('sent')
    } catch {
      setError('We could not send your message. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 max-w-xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-teal-50">
          <Mail className="h-5 w-5 text-teal-700" />
        </div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-600">Contact PreLoved</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">How can we help?</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          Send a message about the site, account support, safety concerns or partnerships. We will reply to the email address you provide.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-teal-900">
          <h2 className="font-semibold">Message sent</h2>
          <p className="mt-1 text-sm">Thanks for reaching out. Your message has been delivered.</p>
          <button type="button" onClick={() => setStatus('idle')} className="mt-4 text-sm font-semibold underline">Send another message</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">Subject</label>
            <input id="subject" name="subject" required minLength={3} maxLength={120} placeholder="What can we help with?" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea id="message" name="message" required minLength={10} maxLength={3000} rows={7} placeholder="Tell us what happened or what you need." className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
          </div>

          <button type="submit" disabled={status === 'sending'} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 sm:w-auto">
            {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}
