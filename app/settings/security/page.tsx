'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Heart, Loader2, ShieldCheck } from 'lucide-react'

type SecurityState = {
  email: string
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  twoFactorMethod: 'email' | 'phone'
}

export default function SecuritySettingsPage() {
  const [state, setState] = useState<SecurityState | null>(null)
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/account/security/2fa')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load security settings')
        return res.json()
      })
      .then((data) => {
        setState(data)
        setMethod(data.twoFactorMethod === 'phone' ? 'phone' : 'email')
      })
      .catch((err) => setError(err.message))
  }, [])

  const update2fa = async (enabled: boolean) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/account/security/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, method, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unable to update 2FA')
        return
      }
      setState((current) => current ? { ...current, twoFactorEnabled: enabled, twoFactorMethod: method } : current)
      setPassword('')
      setMessage(enabled ? 'Two-factor authentication is now enabled.' : 'Two-factor authentication is now disabled.')
    } catch {
      setError('Unable to update two-factor authentication.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Heart className="w-4 h-4 text-[#0BA8A4] fill-[#0BA8A4]" />
          <span className="text-sm font-black tracking-[0.25em] uppercase">PreLoved</span>
        </Link>

        <div className="bg-white border border-gray-200 p-7 sm:p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Account</p>
              <h1 className="text-2xl font-black uppercase tracking-tight">Security</h1>
              <p className="text-sm text-gray-500 mt-1">Manage verified contact methods and two-factor authentication.</p>
            </div>
          </div>

          {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {message && <div className="mb-5 border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{message}</div>}

          {!state ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <>
              <section className="border-b border-gray-200 pb-7 mb-7">
                <h2 className="text-xs font-black uppercase tracking-wider mb-4">Verified contacts</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 border border-gray-200 px-4 py-3">
                    <div><p className="text-xs font-bold uppercase tracking-wide">Email</p><p className="text-sm text-gray-500 mt-0.5">{state.email}</p></div>
                    {state.emailVerified ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <span className="text-xs font-bold text-amber-600">Unverified</span>}
                  </div>
                  <div className="flex items-center justify-between gap-4 border border-gray-200 px-4 py-3">
                    <div><p className="text-xs font-bold uppercase tracking-wide">Phone</p><p className="text-sm text-gray-500 mt-0.5">{state.phone || 'Not added'}</p></div>
                    {state.phoneVerified ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <span className="text-xs font-bold text-amber-600">Unverified</span>}
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider">Two-factor authentication</h2>
                    <p className="text-sm text-gray-500 mt-1">Require a fresh one-time code after your password.</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider ${state.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {state.twoFactorEnabled ? 'Enabled' : 'Off'}
                  </span>
                </div>

                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">Second factor</label>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button type="button" onClick={() => setMethod('email')} className={`border p-4 text-left ${method === 'email' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-black uppercase tracking-wide">Email code</p>
                    <p className="text-xs text-gray-500 mt-1">Sent to your verified email.</p>
                  </button>
                  <button type="button" onClick={() => setMethod('phone')} className={`border p-4 text-left ${method === 'phone' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-black uppercase tracking-wide">SMS code</p>
                    <p className="text-xs text-gray-500 mt-1">Sent to your verified phone.</p>
                  </button>
                </div>

                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">Confirm your password</label>
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="Current password" />

                <button
                  onClick={() => update2fa(!state.twoFactorEnabled)}
                  disabled={busy || !password}
                  className={`mt-4 w-full py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] disabled:opacity-40 ${state.twoFactorEnabled ? 'border border-red-300 text-red-700 hover:bg-red-50' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {busy ? 'Saving...' : state.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
