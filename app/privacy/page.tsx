import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white py-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Heart className="w-5 h-5 text-teal-600 fill-teal-600" />
            <span className="text-xl font-black tracking-[0.2em] uppercase text-teal-700">PreLoved</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: June 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Name and email address</li>
              <li>City/location information</li>
              <li>Listings you create and photos you upload</li>
              <li>Messages and communications with other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Provide and improve the PreLoved service</li>
              <li>Send you email verification links for account access control</li>
              <li>Communicate with you about your account and listings</li>
              <li>Prevent fraud and illegal activity</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Email Verification</h2>
            <p>When email verification is required, we send a secure verification link to your account email address. Verification tokens are short-lived and removed after successful verification.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your passwords are hashed using industry-standard encryption.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p>We use third-party services for specific functions:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong>SMTP provider:</strong> For account verification email delivery</li>
              <li><strong>NextAuth:</strong> For secure authentication</li>
              <li><strong>PostgreSQL:</strong> For secure data storage</li>
            </ul>
            <p className="mt-2">These services have their own privacy policies which we encourage you to review.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User-Generated Content</h2>
            <p>Listings and photos you post are publicly visible to other PreLoved users. Do not post any personal information you do not want to be public. You are responsible for all content you post.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy at any time. We will notify you of significant changes by updating the “Last updated” date at the top of this page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@preloved.app</p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
