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
  Video, MessageSquare, TrendingUp, Palette, ArrowRight, Shield, LogIn,
  Droplet, Moon, Apple, CheckSquare, ImageIcon, Mic, Share2, Eye,
  Sliders, Accessibility, MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ===================== FREE FEATURES =====================
const freeFeatures = [
  { 
    icon: Target, 
    title: 'Goal Setting & Vision Boards', 
    description: 'Set meaningful goals with AI-generated steps, track habits, create vision boards with images, and share progress with accountability partners.',
    color: 'from-purple-500 to-indigo-500'
  },
  { 
    icon: Heart, 
    title: 'Complete Wellness Tracking', 
    description: 'Track self-care routines, water intake (multiple check-ins), meals, sleep, mood check-ins, intermittent fasting, elimination diets, and more.',
    color: 'from-pink-500 to-rose-500'
  },
  { 
    icon: Pill, 
    title: 'Medication & Supplement Management', 
    description: 'Never miss a dose. Track medications and supplements with flexible scheduling by time of day, dosage notes, and prescribing doctor info.',
    color: 'from-teal-500 to-cyan-500'
  },
  { 
    icon: PawPrint, 
    title: 'Pet Care Tracking', 
    description: 'Track feeding schedules, walks, playtime, medications, grooming, and activity logs for all your fur babies.',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    icon: Bell, 
    title: 'Care Reminders', 
    description: 'Custom reminders for caregiving, plant watering, car maintenance, birthdays, or any recurring task. Organized by person or category.',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Users, 
    title: 'Personal Contact Manager', 
    description: 'Track your IRL people with birthdays, notes, social links, relationship details, and family roles.',
    color: 'from-blue-500 to-sky-500'
  },
  { 
    icon: BookOpen, 
    title: 'Journaling with AI Reframing', 
    description: 'Multiple journal entry types (gratitude, venting, reflection). AI-powered therapeutic reframing to shift negative thoughts.',
    color: 'from-violet-500 to-purple-500'
  },
  { 
    icon: MessageSquare, 
    title: 'Quick Notes & Ideas', 
    description: 'Capture ideas, negative thoughts (with AI reframing), gratitude moments, and reminders on the go.',
    color: 'from-indigo-500 to-blue-500'
  },
  { 
    icon: Heart, 
    title: 'Prayer Requests', 
    description: 'Track prayer requests, share with community, receive encouragement, and celebrate answered prayers.',
    color: 'from-rose-500 to-pink-500'
  },
  { 
    icon: Sparkles, 
    title: 'Daily Motivations', 
    description: 'Personalized daily greetings with scriptures, quotes, affirmations, or motivational messages. Save favorites for content creation.',
    color: 'from-amber-500 to-yellow-500'
  },
  { 
    icon: Palette, 
    title: "Pixel's Paradise Resources", 
    description: 'Curated design resources, AI tools, learning materials, and community workshops from PixelNutsCreative.',
    color: 'from-rose-500 to-red-500'
  },
];

// ===================== NEURODIVERGENT FEATURES =====================
const neurodivergentFeatures = [
  { icon: Brain, title: 'ADHD-Friendly Mode', description: 'Checklists, structure, and simplified interfaces to reduce overwhelm' },
  { icon: Accessibility, title: 'Autism-Friendly Mode', description: 'Reduced animations, sensory-friendly design, clear navigation' },
  { icon: Eye, title: 'High Contrast Mode', description: 'Enhanced visibility for those with visual needs' },
  { icon: Sliders, title: 'Fully Customizable', description: 'Drag-and-drop feature ordering, custom colors, choose your theme' },
  { icon: Mic, title: 'Text-to-Speech', description: 'Have options and buttons read aloud' },
  { icon: CheckSquare, title: 'Self-Care Gating', description: 'Optional: Block certain features until self-care tasks are done' },
];

// ===================== SOCIAL MEDIA SUITE (PREMIUM) =====================
const socialMediaFeatures = [
  { 
    icon: Users, 
    title: 'Creator Contact Database', 
    description: 'Track creators with usernames, pronouns, phonetics for songs, roles, mod relationships, clubs/groups, battle inventory, and detailed notes.',
  },
  { 
    icon: TrendingUp, 
    title: 'Social Engagement Tracker', 
    description: 'Never forget to engage! Set daily, weekly, or monthly schedules. Track across TikTok, Instagram, YouTube, and more.',
  },
  { 
    icon: Calendar, 
    title: 'Creator Calendar', 
    description: "Track your favorite creators' live schedules by day and type. Filter by battles, shops, teaching, and more. Export to your device calendar.",
  },
  { 
    icon: Video, 
    title: 'Content Calendar', 
    description: 'Plan your own lives, posts, and engagement sessions. Multiple platforms supported. Share to the community directory.',
  },
  { 
    icon: Eye, 
    title: 'Discover Creators', 
    description: 'Browse the community directory of live schedules. Find new creators by type, platform, and schedule. Sign up for reminders.',
  },
  { 
    icon: Gift, 
    title: 'Gift Gallery Gratitude', 
    description: 'Track your weekly top gifters with usernames, phonetics, gifts, and rankings. Perfect for shoutout songs.',
  },
  { 
    icon: Music, 
    title: 'AI Song Generators', 
    description: 'Multiple song types: Gift Gallery songs, Holy Hitmakers (faith-based), battle hype songs, milestone celebrations, and custom themes.',
  },
  { 
    icon: Share2, 
    title: 'Song Collaboration', 
    description: 'Share generated songs with collaborators. Perfect for working with music producers or other creators.',
  },
];

// ===================== CUSTOMIZATION FEATURES =====================
const customizationFeatures = [
  { title: 'Custom Theme Colors', description: 'Choose your primary and accent colors' },
  { title: 'Dark/Light/System Mode', description: 'Automatic or manual theme switching' },
  { title: 'Menu Color Customization', description: 'Personalize your sidebar color' },
  { title: 'Profile & Header Images', description: 'Add your own branding' },
  { title: 'Feature Ordering', description: 'Drag and drop to reorder menu items' },
  { title: 'Enable/Disable Modules', description: 'Show only what you need' },
  { title: 'Quick Actions Widget', description: 'Floating shortcuts to frequently used features' },
  { title: 'SoundCloud Integration', description: 'Embed your playlist in the app' },
  { title: 'Multiple Greeting Types', description: 'Rotate through scriptures, quotes, and affirmations' },
];

export default function Home() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Capture referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
      // Track click with source info if available
      base44.functions.invoke('trackReferral', { 
        referralCode: refCode, 
        activityType: 'click',
        sourceType: urlParams.get('source_type') || null,
        sourceDetail: urlParams.get('source_detail') || null
      }).catch(() => {});
    }

    base44.auth.isAuthenticated().then(auth => {
      setIsAuthenticated(auth);
      setCheckingAuth(false);
      if (auth) {
        navigate(createPageUrl('Dashboard'));
      }
    }).catch(() => {
      setCheckingAuth(false);
    });
  }, [navigate]);

  const handleLogin = () => {
    if (isAuthenticated) {
      window.location.href = createPageUrl('Dashboard');
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = createPageUrl('Dashboard');
    } else {
      // Redirect to signup page (base44.auth.redirectToLogin with signup=true or just use the signup URL)
      const signupUrl = window.location.origin + '/auth/signup?next=' + encodeURIComponent(createPageUrl('Dashboard'));
      window.location.href = signupUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="Let's Thrive!" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              Let's Thrive!
            </span>
          </div>
          {checkingAuth ? (
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
          ) : isAuthenticated ? (
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleLogin}
              variant="outline"
              className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
            >
              Log In
            </Button>
          )}
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
                alt="Let's Thrive!" 
                className="w-16 h-16 md:w-20 md:h-20"
              />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Let's Thrive!
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Your all-in-one companion for <span className="text-teal-400 font-semibold">crushing goals</span>, 
              <span className="text-purple-400 font-semibold"> thriving daily</span>, and 
              <span className="text-pink-400 font-semibold"> building community</span>.
            </p>
            
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Built with love for creators, go-getters, and anyone who wants to level up their life. 
              <span className="text-purple-400 font-semibold"> Neurodivergent-friendly.</span> Beautifully designed. Actually useful.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-lg px-8 py-6"
              >
                Start Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10 text-lg px-8 py-6">
                  See All Features
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Free Features Section */}
      <div id="features" className="max-w-6xl mx-auto px-4 py-20">
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
                transition={{ delay: index * 0.05 }}
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

      {/* Neurodivergent Section */}
      <div className="bg-gradient-to-r from-fuchsia-900/30 via-purple-900/30 to-fuchsia-900/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 text-lg px-4 py-1 mb-4">
              <Brain className="w-4 h-4 inline mr-2" />
              NEURODIVERGENT-FRIENDLY
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-fuchsia-400">How Your Brain Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              ADHD? Autism? Anxiety? We've got you covered with customizable interfaces, 
              reduced sensory input, and features designed for different ways of thinking.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {neurodivergentFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full bg-gray-800/80 border-fuchsia-500/30">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                          <p className="text-sm text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Social Media Suite Section */}
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
            {socialMediaFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
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

      {/* Customization Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-4 py-1 mb-4">
            <Sliders className="w-4 h-4 inline mr-2" />
            FULLY CUSTOMIZABLE
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Make It <span className="text-amber-400">Yours</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Every feature can be customized. And if there's something you want that doesn't exist yet - just ask!
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {customizationFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="p-4 rounded-xl bg-gray-800/50 border border-amber-500/20"
            >
              <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Creator Message */}
      <div className="bg-gray-800/50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built by <span className="text-purple-400">@PixelNutsCreative</span>
            </h2>
            <p className="text-xl text-gray-300 mb-6">
              I built this app because I needed it myself. As someone who is neurodivergent, 
              I wanted tools that actually work for how my brain operates.
            </p>
            <p className="text-lg text-gray-400 mb-8">
              <strong className="text-teal-400">Have a feature idea?</strong> I'm always listening! 
              If you think of something that would help you thrive, let me know. 
              If it's a good fit, I'll build it!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://tiktok.com/@pixelnutscreative" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400/10">
                  Follow on TikTok
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-4 py-1 mb-4 animate-pulse">
            🎄 HOLIDAY SPECIAL - Ends December 7th!
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get <span className="text-purple-400">Access</span>
          </h2>
          <p className="text-xl text-gray-400">
            Choose how you want to unlock the Social Media Suite
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Holiday Special - 7 months */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-teal-900/30 to-emerald-900/30 border-teal-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-teal-500 to-emerald-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">
                🎄 HOLIDAY DEAL
              </div>
              <CardContent className="p-6 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-teal-400 mb-2">7 for 7 Special</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-white">$7</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <p className="text-teal-300 text-sm mt-1">for 7 months ($49 total)</p>
                  <p className="text-xs text-gray-500 mt-2">Ends December 7th!</p>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">All free features</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Full Social Media Suite</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Priority support</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                >
                  Get 7 for 7 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Holiday Annual - $77 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 relative overflow-hidden ring-2 ring-purple-500">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">
                ⭐ BEST VALUE
              </div>
              <CardContent className="p-6 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">Annual (Holiday)</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl text-gray-500 line-through">$111</span>
                    <span className="text-4xl font-bold text-white">$77</span>
                  </div>
                  <p className="text-purple-300 text-sm mt-1">per year (~$6.42/month)</p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                    Save $34!
                  </Badge>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">All free features</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Full Social Media Suite</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Priority support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Best price per month!</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Get Annual Deal <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Toolbox Bundle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-bl-lg">
                🎁 BUNDLE
              </div>
              <CardContent className="p-6 pt-12">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-amber-400 mb-2">AI Toolbox Bundle</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-white">FREE</span>
                  </div>
                  <p className="text-amber-300 text-sm mt-1">with AI Toolbox annual sub</p>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Everything in Let's Thrive!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Pixel's AI Toolbox access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Two apps, one subscription!</span>
                  </div>
                </div>

                <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-200 text-center">
                    Already an AI Toolbox subscriber? You get this FREE!
                  </p>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SuperFan Option - Below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 max-w-md mx-auto"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-amber-400">Already a SuperFan?</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                If you're a SuperFan of @PixelNutsCreative on TikTok, you get FREE access!
              </p>
              <Button 
                onClick={handleGetStarted}
                variant="outline"
                className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
              >
                Verify SuperFan Status <Star className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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
              Join creators and go-getters who are crushing their goals daily.
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