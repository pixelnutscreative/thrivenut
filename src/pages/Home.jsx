import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, Heart, Pill, PawPrint, Bell, Users, BookOpen, Brain, 
  Sparkles, Check, Star, Crown, Zap, Gift, Music, Calendar,
  Video, MessageSquare, TrendingUp, Palette, ArrowRight, Shield, LogIn
} from 'lucide-react';
import { motion } from 'framer-motion';

const freeFeatures = [
  { 
    icon: Target, 
    title: 'Goal Setting & Tracking', 
    description: 'Set meaningful goals, break them into steps, track daily habits, and share progress with accountability partners.',
    color: 'from-purple-500 to-indigo-500'
  },
  { 
    icon: Heart, 
    title: 'Daily Wellness Tracking', 
    description: 'Track self-care routines, water intake, meals, sleep, mood check-ins, fasting schedules, and build healthy habits.',
    color: 'from-pink-500 to-rose-500'
  },
  { 
    icon: Pill, 
    title: 'Medication & Supplement Management', 
    description: 'Never miss a dose. Track multiple medications and supplements with flexible scheduling and daily reminders.',
    color: 'from-teal-500 to-cyan-500'
  },
  { 
    icon: PawPrint, 
    title: 'Pet Care Tracking', 
    description: 'Keep your fur babies happy! Track feeding schedules, walks, medications, grooming, and vet appointments.',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    icon: Bell, 
    title: 'Care Reminders', 
    description: 'Custom reminders for anything - plant watering, car maintenance, birthdays, or any recurring task you need.',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Users, 
    title: 'Contact Management', 
    description: 'Keep track of your people with birthdays, notes, social links, business info, and relationship details.',
    color: 'from-blue-500 to-sky-500'
  },
  { 
    icon: BookOpen, 
    title: 'Journaling with AI Support', 
    description: 'Reflect on your day with guided prompts. Get AI-powered therapeutic reframing to shift negative thoughts.',
    color: 'from-violet-500 to-purple-500'
  },
  { 
    icon: Brain, 
    title: 'Neurodivergent-Friendly Design', 
    description: 'ADHD & autism-friendly modes, high contrast options, reduced animations, and customizable interfaces.',
    color: 'from-fuchsia-500 to-pink-500'
  },
  { 
    icon: Palette, 
    title: "Pixel's Paradise Resources", 
    description: 'Curated design resources, AI tools, learning materials, and community workshops from PixelNutsCreative.',
    color: 'from-rose-500 to-red-500'
  },
];

const paidFeatures = [
  { 
    icon: Users, 
    title: 'Creator Contact Database', 
    description: 'Track creators with usernames, roles, engagement preferences, mod relationships, clubs/groups, battle inventory, and more.',
  },
  { 
    icon: Sparkles, 
    title: 'Social Engagement Tracker', 
    description: 'Never forget to engage! Set daily, weekly, or custom schedules. Track engagement across multiple platforms.',
  },
  { 
    icon: Calendar, 
    title: 'Creator Calendar', 
    description: 'Track your favorite creators\' live schedules. Filter by day, type, priority. Export to your device calendar.',
  },
  { 
    icon: Video, 
    title: 'Content Calendar', 
    description: 'Plan your own content creation, scheduled posts, lives, and engagement activities throughout the week.',
  },
  { 
    icon: Bell, 
    title: 'Live Reminders', 
    description: 'Get notified when your favorite creators go live. Sign up for reminders from the Discover Creators directory.',
  },
  { 
    icon: TrendingUp, 
    title: 'Discover Creators', 
    description: 'Find new creators to watch! Browse the community directory of live schedules shared by other users.',
  },
  { 
    icon: Gift, 
    title: 'Gift Gallery Gratitude', 
    description: 'Track your top gifters weekly. Add them to your gallery with usernames, phonetics, and the gifts they sent.',
  },
  { 
    icon: Music, 
    title: 'AI Song Generator', 
    description: 'Generate personalized thank-you songs for your gifters! Custom lyrics featuring their names and gifts.',
  },
];

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Don't auto-redirect - let users see the landing page
    base44.auth.isAuthenticated().then(auth => {
      setIsAuthenticated(auth);
      setCheckingAuth(false);
    }).catch(() => {
      setCheckingAuth(false);
    });
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
            alt="Thrive Nut" 
            className="w-20 h-20"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header with Login */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="Thrive Nut" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              Thrive Nut
            </span>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In / Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-gray-900" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="Thrive Nut" 
                className="w-16 h-16 md:w-20 md:h-20"
              />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Thrive Nut
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Your all-in-one companion for <span className="text-teal-400 font-semibold">crushing goals</span>, 
              <span className="text-purple-400 font-semibold"> thriving daily</span>, and 
              <span className="text-pink-400 font-semibold"> building community</span>.
            </p>
            
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Built with love for creators, go-getters, and anyone who wants to level up their life. 
              Neurodivergent-friendly. Beautifully designed. Actually useful.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-lg px-8 py-6"
              >
                Start Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10 text-lg px-8 py-6">
                  See Pricing
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Free Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-lg px-4 py-1 mb-4">
            100% FREE
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-teal-400">Thrive</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No credit card required. No hidden fees. Just powerful tools to help you live your best life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card className={`h-full bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 ${hoveredFeature === index ? 'scale-105 shadow-xl shadow-purple-500/20' : ''}`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Social Media Suite Add-On Section */}
      <div className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-lg px-4 py-1 mb-4">
              ✨ PREMIUM ADD-ON
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Social Media Suite
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
              The ultimate toolkit for live streamers, content creators, and community builders.
            </p>
            <p className="text-lg text-purple-400">
              Everything you need to grow your audience and show love to your supporters.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {paidFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-gray-800/80 border-purple-500/30 hover:border-pink-500/50 transition-all">
                    <CardContent className="p-5">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get <span className="text-purple-400">Access</span>
          </h2>
          <p className="text-xl text-gray-400">
            Choose how you want to unlock the Social Media Suite
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* SuperFan Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">
                <Star className="w-4 h-4 inline mr-1" /> SUPERFAN
              </div>
              <CardContent className="p-8 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-amber-400 mb-2">Pixel's SuperFan</h3>
                  <div className="text-5xl font-bold text-white mb-2">FREE</div>
                  <p className="text-amber-300">Forever access to everything</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">All free features included</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Full Social Media Suite access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Lifetime access as long as you're a SuperFan</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Special recognition in the app</span>
                  </div>
                </div>

                <div className="bg-amber-900/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-200 text-center">
                    Already a SuperFan of @PixelNutsCreative? 
                    Upload a screenshot when you sign up to verify!
                  </p>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-lg py-6"
                >
                  I'm a SuperFan! <Crown className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Paid Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">
                <Zap className="w-4 h-4 inline mr-1" /> FULL ACCESS
              </div>
              <CardContent className="p-8 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">Annual Subscription</h3>
                  <div className="text-5xl font-bold text-white mb-2">$111</div>
                  <p className="text-purple-300">per year (less than $10/month!)</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">All free features included</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Full Social Media Suite access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Support an independent creator</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Priority support</span>
                  </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-200 text-center">
                    🎉 Start with a <strong>7-day free preview</strong> - no payment required!
                  </p>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6"
                >
                  Start 7-Day Preview <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-teal-900/50 via-purple-900/50 to-pink-900/50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-teal-400">Thrive</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of creators and go-getters who are crushing their goals daily.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 hover:from-teal-600 hover:via-purple-600 hover:to-pink-600 text-lg px-12 py-6"
            >
              Get Started Free <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
          <p>Made with 💜 by <a href="https://tiktok.com/@pixelnutscreative" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">@PixelNutsCreative</a></p>
        </div>
      </footer>
    </div>
  );
}