import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: October 10, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm md:prose-base max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">
              ThriveNut collects information you provide directly to us, including your name, email address,
              profile details, and any content you create within the app such as tasks, goals, journal entries,
              wellness logs, and group activities. We also collect usage data such as pages visited, time spent,
              and device information to improve the app experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">
              We use your information to provide and maintain the ThriveNut service, personalize your experience,
              communicate with you about your account, process payments for premium features, and improve our
              features based on your feedback and usage patterns.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell your personal data. We share data only with service providers who help us operate
              ThriveNut (such as payment processors and cloud hosting), and when required by law. Group content
              you create is visible only to members of that group according to the permissions you set.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Retention & Deletion</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active. You can request account deletion at any
              time from Settings. After deletion is requested, your data enters a 30-day grace period during
              which you can cancel. After 30 days, all personal data is permanently removed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We use industry-standard encryption and security measures to protect your data. However, no method
              of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              ThriveNut offers parent-managed child accounts. Parents control what data their children share.
              We do not knowingly collect personal information from children without parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have the right to access, correct, or delete your personal data. You can export your data or
              delete your account through the app's Settings page. For data requests, contact us through the
              Support page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy, please reach out through our{' '}
              <Link to={createPageUrl('Support')} className="text-teal-600 hover:underline">Support page</Link>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link to={createPageUrl('Home')} className="text-teal-600 hover:underline text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}