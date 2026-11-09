'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MessageForm({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to send message')
        return
      }
      setBody('')
      router.refresh()
    } catch {
      setError('Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="message-body" className="sr-only">Message</label>
      <textarea
        id="message-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Write a message..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0BA8A4]"
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !body.trim()}
        className="px-4 py-2 rounded-lg bg-[#0BA8A4] text-white font-medium disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
