import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Heart, BookOpen, Sparkles, CheckCircle, Gift, Music } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: TrendingUp,
    title: 'TikTok Content Goals',
    description: 'Track your posts, lives, TT Shop streams, and community engagement every week',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Target,
    title: 'Personal Goals',
    description: 'Set and crush goals in every area of your life - spiritual, health, financial, and more',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Heart,
    title: 'Wellness & Health',
    description: 'Track water, mood, sleep, supplements, medications, and mental health in one place',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: BookOpen,
    title: 'Private Journal',
    description: 'Reflect, grow, and capture your thoughts in your personal journal space',
    color: 'from-amber-500 to-orange-500'
  }
];

const benefits = [
  'Perfect for creators and TikTok entrepreneurs',
  'Track everything in one beautiful app',
  'Daily motivation and scripture/quotes',
  'Gifter thank-you song generator',
  'Medication & supplement tracking',
  'Mobile-friendly, access anywhere'
];

export default function Home() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    // This will trigger login if not authenticated, then redirect to Dashboard
    window.location.href = createPageUrl('Dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="ThriveNut Logo" 
                className="w-24 h-24 md:w-32 md:h-32"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-teal-600 via-teal-500 to-lavender-500 bg-clip-text text-transparent">
              ThriveNut
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
              Crush Your Goals. Thrive Daily.
            </p>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              The all-in-one app for creators, achievers, and goal-crushers who want to track their TikTok content, wellness, and life goals in one beautiful place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                Get Started Free
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Everything You Need to Thrive</h2>
          <p className="text-xl text-gray-600">Powerful tools designed for your success</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Why ThriveNut Section */}
      <div className="bg-white/50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why ThriveNut?</h2>
            <p className="text-xl text-gray-600">Built for creators who want more than just another app</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-purple-400 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-gray-700 font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-teal-600 via-teal-500 to-purple-400 text-white border-0 shadow-2xl">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Start Thriving?</h2>
              <p className="text-xl mb-8 text-white/90">
                Join creators who are crushing their goals every single day
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-teal-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold shadow-xl"
              >
                Get Started Now - It's Free! 🚀
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 ThriveNut. Made with 💜 for creators who want to thrive.
          </p>
        </div>
      </div>
    </div>
  );
}