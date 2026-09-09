'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Heart, Loader2, MapPin, Phone } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use international format, including your country code.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  city: z.string().min(2, 'Please enter your city or region').max(100),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Registration failed. Please try again.')
        return
      }

      sessionStorage.setItem('preloved-verification-user', json.id)
      router.push(`/verify?user=${encodeURIComponent(json.id)}`)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4 py-8 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600">
              <Heart className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-2xl font-bold text-teal-700">PreLoved</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Join the community</h1>
          <p className="mt-1 text-sm text-gray-500">Create your free, verified account from anywhere.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
              <input {...register('name')} autoComplete="name" placeholder="Jane Smith" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Mobile number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input {...register('phone')} type="tel" autoComplete="tel" placeholder="e.g. +2348012345678 or +14165551234" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Include the + country code. Used for verification and optional 2FA only.</p>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">City / Region</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input {...register('city')} autoComplete="address-level2" placeholder="e.g. Lagos, Nigeria or Toronto, ON" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Min. 8 characters, 1 uppercase, 1 number" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create & Verify Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-teal-600 hover:underline">Sign in</Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">By joining, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  )
}
