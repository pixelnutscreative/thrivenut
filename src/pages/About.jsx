import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Info, Heart, Target, Users, Sparkles, Shield, Zap } from 'lucide-react';

const APP_VERSION = '1.0.0';

const features = [
  { icon: Target, title: 'Goals & Habits', description: 'Set meaningful goals with AI-generated steps and track daily habits.' },
  { icon: Heart, title: 'Wellness Suite', description: 'Track mood, water, sleep, supplements, medications, and self-care.' },
  { icon: Users, title: 'Groups & Community', description: 'Create groups for family, business, coaching, or creator communities.' },
  { icon: Sparkles, title: 'Creator Studio', description: 'Content planning, AI tools, song generators, and social media tracking.' },
  { icon: Shield, title: 'Privacy First', description: 'Your data is yours. Delete your account anytime with a 30-day safety net.' },
  { icon: Zap, title: 'Neurodivergent-Friendly', description: 'Customizable interfaces, reduced overwhelm, and flexible workflows.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png"
            alt="ThriveNut"
            className="w-20 h-20 mb-4"
          />
          <h1 className="text-3xl font-bold mb-1">ThriveNut</h1>
          <p className="text-gray-500">Version {APP_VERSION}</p>
          <p className="text-lg text-gray-600 mt-4 max-w-xl">
            Your all-in-one companion for crushing goals, thriving daily, and building community.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold">Our Mission</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            ThriveNut was built by a creator who needed it herself. As someone who is neurodivergent,
            she wanted tools that actually work for how her brain operates. The result is a customizable,
            all-in-one platform designed for creators, families, and achievers who want to level up their
            lives without juggling a dozen different apps.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link
            to={createPageUrl('PrivacyPolicy')}
            className="px-4 py-2 min-h-[44px] flex items-center text-sm text-gray-600 hover:text-teal-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to={createPageUrl('TermsOfService')}
            className="px-4 py-2 min-h-[44px] flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            to={createPageUrl('Support')}
            className="px-4 py-2 min-h-[44px] flex items-center text-sm text-gray-600 hover:text-teal-600 transition-colors"
          >
            Support
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-6 border-t border-gray-200">
          <p>Made with care for creators, families, and achievers.</p>
        </div>
      </div>
    </div>
  );
}