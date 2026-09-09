'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to send reset code')
      setStep('reset')
      setMessage('If that email is registered, a 6-digit reset code has been sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code')
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to reset password')
      router.push('/login?reset=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-gray-200 p-7">
        <Link href="/" className="inline-flex items-center gap-2 mb-7">
          <Heart className="w-4 h-4 text-[#0BA8A4] fill-[#0BA8A4]" />
          <span className="text-sm font-black tracking-[0.25em] uppercase">PreLoved</span>
        </Link>

        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Account Recovery</p>
        <h1 className="text-2xl font-black uppercase tracking-tight mt-1 mb-3">Reset password</h1>
        <p className="text-sm text-gray-500 mb-6">{step === 'request' ? 'We’ll send a short-lived reset code to your verified email.' : 'Enter the code and choose a new password.'}</p>

        {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</div>}

        {step === 'request' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
            <button disabled={busy} className="w-full bg-black text-white py-3.5 text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Send reset code
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-full border border-gray-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-black" />
            <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
            <p className="text-[11px] text-gray-400">At least 8 characters, one uppercase letter and one number.</p>
            <button disabled={busy || code.length !== 6} className="w-full bg-black text-white py-3.5 text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Reset password
            </button>
          </form>
        )}

        <Link href="/login" className="block text-center text-xs font-bold text-gray-500 hover:text-black mt-6">Back to sign in</Link>
      </div>
    </div>
  )
}
