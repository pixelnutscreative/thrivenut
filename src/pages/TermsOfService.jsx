import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: October 10, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm md:prose-base max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By creating an account or using ThriveNut, you agree to these Terms of Service. If you do not agree,
              please do not use the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Your Account</h2>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for maintaining the security of your account and for all activities that occur
              under your account. You must be at least 13 years old to create an account. Parental consent is
              required for users under 18.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree not to use ThriveNut to harass others, post unlawful content, attempt to access
              unauthorized data, interfere with the service, or use the app for any illegal purpose. Group owners
              are responsible for content shared within their groups.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Subscriptions & Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              Premium features require a paid subscription. Payments are processed through Stripe. Subscriptions
              renew automatically until cancelled. You can cancel at any time from your account settings.
              Refunds are handled on a case-by-case basis through Support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Content Ownership</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain ownership of all content you create in ThriveNut. We do not claim ownership of your
              tasks, goals, journal entries, or group posts. You grant us a limited license to host and display
              your content as needed to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              You may delete your account at any time. We may suspend or terminate accounts that violate these
              Terms. Upon termination, your data will be permanently deleted after the 30-day grace period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              ThriveNut is provided "as is" without warranties of any kind. We do not guarantee that the app
              will be error-free or available at all times. Wellness and mental health features are not a
              substitute for professional medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms from time to time. We will notify users of significant changes through
              the app. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Questions about these Terms? Reach out through our{' '}
              <Link to={createPageUrl('Support')} className="text-purple-600 hover:underline">Support page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link to={createPageUrl('Home')} className="text-purple-600 hover:underline text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}