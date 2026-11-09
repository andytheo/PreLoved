'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Heart, Loader2, Mail, Phone } from 'lucide-react'

type Channel = 'email' | 'phone'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = useMemo(
    () => searchParams.get('user') || (typeof window !== 'undefined' ? sessionStorage.getItem('preloved-verification-user') : null),
    [searchParams]
  )

  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [busy, setBusy] = useState<Channel | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const verify = async (channel: Channel, code: string) => {
    if (!userId) {
      setError('Verification session not found. Please register again or use the link from your sign-up flow.')
      return
    }

    setBusy(channel)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/auth/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, channel, code }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Verification failed')
        return
      }

      if (channel === 'email') setEmailVerified(true)
      else setPhoneVerified(true)

      if (json.fullyVerified) {
        sessionStorage.removeItem('preloved-verification-user')
        setMessage('Account verified. You can sign in now.')
        setTimeout(() => router.push('/login?verified=1'), 500)
      } else {
        setMessage(`${channel === 'email' ? 'Email' : 'Phone'} verified. Complete the other step to finish.`)
      }
    } catch {
      setError('Unable to verify your code. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const resend = async (channel: Channel) => {
    if (!userId) return
    setBusy(channel)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/auth/verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, channel }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unable to resend code')
        return
      }
      if (json.alreadyVerified) {
        if (channel === 'email') setEmailVerified(true)
        else setPhoneVerified(true)
        setMessage(`${channel === 'email' ? 'Email' : 'Phone'} is already verified.`)
      } else {
        setMessage(`A new ${channel === 'email' ? 'email' : 'SMS'} code was sent.`)
      }
    } catch {
      setError('Unable to resend code. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const submit = (channel: Channel) => (event: FormEvent) => {
    event.preventDefault()
    verify(channel, channel === 'email' ? emailCode : phoneCode)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#0BA8A4] fill-[#0BA8A4]" />
            <span className="text-lg font-black tracking-[0.25em] uppercase">PreLoved</span>
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Verify your account</h1>
          <p className="text-sm text-gray-500 mt-2">Confirm both contact methods before using PreLoved.</p>
        </div>

        {!userId && (
          <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Verification session missing. <Link className="font-bold underline" href="/register">Create your account again.</Link>
          </div>
        )}
        {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-5 border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{message}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <form onSubmit={submit('email')} className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <Mail className="w-5 h-5 text-[#0BA8A4]" />
              {emailVerified && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider">Email verification</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">Enter the 6-digit code sent to your email.</p>
            <input
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              disabled={emailVerified}
              className="w-full border border-gray-300 px-4 py-3 text-center tracking-[0.35em] text-lg outline-none focus:border-black disabled:bg-gray-50"
            />
            <button disabled={busy !== null || emailVerified || emailCode.length !== 6} className="mt-3 w-full bg-black text-white py-3 text-[11px] font-bold uppercase tracking-wider disabled:opacity-40">
              {busy === 'email' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : emailVerified ? 'Verified' : 'Verify Email'}
            </button>
            <button type="button" onClick={() => resend('email')} disabled={busy !== null || emailVerified} className="mt-3 w-full text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black disabled:opacity-40">Resend email code</button>
          </form>

          <form onSubmit={submit('phone')} className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <Phone className="w-5 h-5 text-[#0BA8A4]" />
              {phoneVerified && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider">Phone verification</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">Enter the 6-digit code sent by SMS.</p>
            <input
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              disabled={phoneVerified}
              className="w-full border border-gray-300 px-4 py-3 text-center tracking-[0.35em] text-lg outline-none focus:border-black disabled:bg-gray-50"
            />
            <button disabled={busy !== null || phoneVerified || phoneCode.length !== 6} className="mt-3 w-full bg-black text-white py-3 text-[11px] font-bold uppercase tracking-wider disabled:opacity-40">
              {busy === 'phone' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : phoneVerified ? 'Verified' : 'Verify Phone'}
            </button>
            <button type="button" onClick={() => resend('phone')} disabled={busy !== null || phoneVerified} className="mt-3 w-full text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black disabled:opacity-40">Resend SMS code</button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Codes expire after 10 minutes. Never share a code with another person.</p>
      </div>
    </div>
  )
}
