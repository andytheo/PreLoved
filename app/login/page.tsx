'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email')
  const [otp, setOtp] = useState('')
  const [pendingCredentials, setPendingCredentials] = useState<LoginForm | null>(null)
  const [otpBusy, setOtpBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const completeSignIn = async (data: LoginForm, oneTimeCode?: string) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      otp: oneTimeCode || '',
      redirect: false,
    })

    if (result?.error) {
      setError(oneTimeCode ? 'Invalid or expired verification code.' : 'Unable to sign in.')
      return false
    }

    router.push('/')
    router.refresh()
    return true
  }

  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      const challenge = await fetch('/api/auth/2fa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await challenge.json()

      if (!challenge.ok) {
        if (json.error === 'VERIFY_ACCOUNT' && json.userId) {
          sessionStorage.setItem('preloved-verification-user', json.userId)
          router.push(`/verify?user=${encodeURIComponent(json.userId)}`)
          return
        }
        setError(json.error || 'Invalid email or password. Please try again.')
        return
      }

      if (json.required) {
        setPendingCredentials(data)
        setOtpChannel(json.channel === 'phone' ? 'phone' : 'email')
        setAwaitingOtp(true)
        return
      }

      await completeSignIn(data)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  const submitOtp = async () => {
    if (!pendingCredentials || otp.length !== 6) return
    setOtpBusy(true)
    setError('')
    await completeSignIn(pendingCredentials, otp)
    setOtpBusy(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between bg-black text-white p-12 w-96 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#0BA8A4] fill-[#0BA8A4]" />
          <span className="text-sm font-black tracking-[0.3em] uppercase">PreLoved</span>
        </Link>
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#0BA8A4] mb-4">Community First</p>
          <h2 className="text-3xl font-black uppercase leading-tight mb-4">Give Items<br />A Second<br />Life</h2>
          <p className="text-sm text-gray-400">100% free · Verified members · Local pickup</p>
        </div>
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} PreLoved</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Heart className="w-4 h-4 text-[#0BA8A4] fill-[#0BA8A4]" />
            <span className="text-sm font-black tracking-[0.3em] uppercase text-black">PreLoved</span>
          </Link>

          {searchParams.get('verified') === '1' && !awaitingOtp && (
            <div className="mb-6 border border-teal-200 bg-teal-50 text-teal-800 px-4 py-3 text-sm">
              Your email and phone are verified. Sign in to continue.
            </div>
          )}

          {awaitingOtp ? (
            <div>
              <ShieldCheck className="w-8 h-8 text-[#0BA8A4] mb-5" />
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-gray-400 mb-2">Two-Factor Authentication</p>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-3">Enter your code</h1>
              <p className="text-sm text-gray-500 mb-6">We sent a 6-digit sign-in code to your verified {otpChannel === 'phone' ? 'phone' : 'email'}.</p>

              {error && <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm mb-5">{error}</div>}

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                className="w-full px-4 py-4 border border-gray-300 focus:border-black text-center text-xl tracking-[0.4em] outline-none"
              />
              <button
                onClick={submitOtp}
                disabled={otpBusy || otp.length !== 6}
                className="mt-4 w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2"
              >
                {otpBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verify & Sign In
              </button>
              <button
                onClick={() => { setAwaitingOtp(false); setPendingCredentials(null); setOtp(''); setError('') }}
                className="mt-4 w-full text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-gray-400 mb-2">Welcome Back</p>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-8">Sign In</h1>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase font-bold text-gray-500 mb-2">Email Address</label>
                  <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-300 focus:border-black text-sm outline-none transition-colors" />
                  {errors.email && <p className="mt-1.5 text-[11px] text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase font-bold text-gray-500 mb-2">Password</label>
                  <div className="relative">
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" className="w-full px-4 py-3 border border-gray-300 focus:border-black text-sm outline-none pr-10 transition-colors" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-[11px] text-red-600">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 mt-2">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Checking account...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[11px] text-gray-500">Don&apos;t have an account?{' '}<Link href="/register" className="font-bold text-black hover:text-[#0BA8A4] transition-colors">Join Free</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
