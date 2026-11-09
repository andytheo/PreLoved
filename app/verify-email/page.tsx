'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Heart, Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()
  const token = searchParams.get('token')
  const attemptedToken = useRef<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || attemptedToken.current === token) return
    attemptedToken.current = token

    const confirm = async () => {
      setIsLoading(true)
      setError('')
      setInfo('Verifying your email...')

      try {
        const res = await fetch('/api/auth/email-verification/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Email verification failed')
          setInfo('')
          return
        }

        await update()
        setSuccess(true)
        setInfo('Email verified successfully. Redirecting...')
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 1500)
      } catch {
        setError('Something went wrong while verifying your email')
        setInfo('')
      } finally {
        setIsLoading(false)
      }
    }

    void confirm()
  }, [router, token, update])

  const resendVerification = async () => {
    setError('')
    setInfo('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/email-verification/resend', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Unable to resend verification email')
        return
      }

      setInfo('Verification email sent. Check your inbox and spam folder.')
    } catch {
      setError('Unable to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white p-4">
        <div className="text-center">
          <p className="text-gray-500">Please sign in first.</p>
          <Link href="/login" className="text-teal-600 font-medium hover:underline mt-2 inline-block">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-teal-700">PreLoved</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-500">Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-6 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <Mail className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-teal-900">Email Verification Required</p>
                  <p className="text-xs text-teal-700 mt-1">
                    Verify your email to post, save, and contact other members.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {searchParams.get('delivery') === 'failed' && !info && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                  Your account was created, but the verification email could not be sent. Please try resending it below.
                </div>
              )}

              {info && (
                <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {info}
                </div>
              )}

              {session?.user && (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}

              {session?.user && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                    className="w-full text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
