'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function EmailVerificationBanner() {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)
  if (status === 'loading' || !session?.user || dismissed || session.user.emailVerified) {
    return null
  }

  return (
    <div className="bg-red-50 border-b-2 border-red-300 px-4 sm:px-6 lg:px-10 py-3.5">
      <div className="flex items-start gap-3 max-w-6xl mx-auto">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">
            We are unable to grant access at this time, please verify your email.
          </p>
          <p className="text-xs text-red-700 mt-1">
            Verify your email before posting or saving items.{' '}
            <Link href="/verify-email" className="font-bold hover:underline">
              Verify now
            </Link>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-red-600 hover:text-red-700 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
