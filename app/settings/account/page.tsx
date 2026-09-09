'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { AlertTriangle, Heart, Loader2 } from 'lucide-react'

export default function AccountSettingsPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const deleteAccount = async () => {
    if (confirmation !== 'DELETE' || !password) return
    if (!window.confirm('Permanently delete your PreLoved account and its listings? This cannot be undone.')) return

    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to delete account')

      await signOut({ callbackUrl: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account')
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
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-400">Settings</p>
          <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Account</h1>
          <p className="text-sm text-gray-500 mt-2 mb-8">Manage account-level actions.</p>

          <div className="border border-red-200 bg-red-50/40 p-5">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-red-800">Delete account</h2>
                <p className="text-sm text-red-700/80 mt-1">
                  This permanently removes your account, listings, requests, favorites, notifications, reports, and blocks from the database.
                </p>
              </div>
            </div>

            {error && <div className="mb-4 border border-red-200 bg-white p-3 text-sm text-red-700">{error}</div>}

            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-2">Current password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black mb-4"
              placeholder="Enter your password"
            />

            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-600 mb-2">
              Type DELETE to confirm
            </label>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              placeholder="DELETE"
            />

            <button
              onClick={deleteAccount}
              disabled={busy || !password || confirmation !== 'DELETE'}
              className="mt-4 w-full bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white py-3 text-[11px] font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Permanently Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
