import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white py-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Heart className="w-5 h-5 text-teal-600 fill-teal-600" />
            <span className="text-xl font-black tracking-[0.2em] uppercase text-teal-700">PreLoved</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: June 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p>By accessing and using PreLoved, you agree to be bound by these Terms of Service. If you do not agree to abide by any part of these terms, you are not authorized to use this service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
            <p>You agree not to use PreLoved for any unlawful purpose or in any way that could damage or impair the service. Prohibited behavior includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Harassing or causing distress or inconvenience to any person</li>
              <li>Obscene or abusive language or images</li>
              <li>Disrupting the normal flow of dialogue within our website</li>
              <li>Attempting to access accounts without permission</li>
              <li>Posting content that violates intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Listings</h2>
            <p>All items posted on PreLoved must be:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Legal to own and distribute</li>
              <li>Not stolen or illegally obtained</li>
              <li>Accurately described</li>
              <li>Safe for local pickup</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p>PreLoved is provided on an “as-is” basis. We make no warranties, express or implied, regarding the service. We are not liable for any damages resulting from your use of the service, including but not limited to personal injury or property damage resulting from in-person pickups.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Your continued use of PreLoved following the posting of revised Terms means that you accept and agree to the changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at support@preloved.app</p>
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
