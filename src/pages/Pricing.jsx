import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const features = [
  'Goal tracking & vision boards',
  'Daily wellness & mood tracking',
  'Journal with AI reframing',
  'Medication & supplement tracking',
  'Pet care reminders',
  'Custom themes & dark mode',
  'Prayer requests (for believers)',
  'Quick notes & brain dumps',
];

const premiumFeatures = [
  'Social Media Suite',
  'Creator contact management',
  'Content calendar',
  'Sunny Songbird AI songs',
  'Gift Gallery for TikTok',
  'Engagement tracking',
  'Discover Creators directory',
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { isDark, bgClass, primaryColor, accentColor } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const checkSub = async () => {
      if (!user) {
        setCheckingSubscription(false);
        return;
      }
      try {
        const response = await base44.functions.invoke('checkSubscription');
        setHasSubscription(response.data?.hasActiveSubscription || false);
      } catch (err) {
        console.error('Error checking subscription:', err);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSub();
  }, [user]);

  const handleSubscribe = async (planType) => {
    if (!user) {
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckout', { plan_type: planType });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(false);
    }
  };

  const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` };
  const gradientTextStyle = { backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent"
            style={gradientTextStyle}
          >
            Choose Your Plan
          </motion.h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Start thriving today with our holiday special pricing!
          </p>
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">
            🎄 Holiday Special - Ends Dec 7th!
          </Badge>
        </div>

        {checkingSubscription ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
          </div>
        ) : hasSubscription ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <Check className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Already Subscribed! 🎉</h2>
              <p className="text-gray-600 mb-6">You have full access to all Let's Thrive features.</p>
              <Link to={createPageUrl('Dashboard')}>
                <Button style={gradientStyle} className="text-white">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Monthly Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`h-full ${isDark ? 'bg-gray-800' : ''}`}>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                      <Zap className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                    <CardTitle>Monthly</CardTitle>
                    <p className="text-sm text-gray-500">Perfect to try it out</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold">$7</span>
                      <span className="text-gray-500">/month</span>
                      <p className="text-sm text-green-600 font-medium">for 7 months!</p>
                    </div>
                    <Button
                      onClick={() => handleSubscribe('monthly')}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
                    </Button>
                    <ul className="text-left space-y-2 text-sm">
                      {features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Annual Plan - Featured */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full relative border-2" style={{ borderColor: primaryColor }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge style={gradientStyle} className="text-white px-4">
                      Best Value
                    </Badge>
                  </div>
                  <CardHeader className="text-center pb-2 pt-6">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={gradientStyle}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>Annual</CardTitle>
                    <p className="text-sm text-gray-500">Save big with yearly!</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold">$77</span>
                      <span className="text-gray-500">/year</span>
                      <p className="text-sm text-green-600 font-medium">Save $35 vs monthly!</p>
                      <p className="text-xs text-gray-400 line-through">Was $111/year</p>
                    </div>
                    <Button
                      onClick={() => handleSubscribe('annual')}
                      disabled={loading}
                      className="w-full text-white"
                      style={gradientStyle}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Annual Access'}
                    </Button>
                    <ul className="text-left space-y-2 text-sm">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Toolbox Bundle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={`h-full ${isDark ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>AI Toolbox Bundle</CardTitle>
                    <p className="text-sm text-gray-500">Get it FREE!</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold text-green-600">FREE</span>
                      <p className="text-sm text-purple-600 font-medium">with AI Toolbox annual</p>
                    </div>
                    <Button
                      onClick={() => window.open('https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540', '_blank')}
                      variant="outline"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get AI Toolbox
                    </Button>
                    <div className="text-left">
                      <p className="text-xs text-gray-500 mb-2">Includes Let's Thrive PLUS:</p>
                      <ul className="space-y-2 text-sm">
                        {['All AI tools & prompts', 'Go Nuts! Classes', 'Templates & tutorials', 'Community access'].map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Premium Features Section */}
            <Card className={isDark ? 'bg-gray-800' : ''}>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5" style={{ color: primaryColor }} />
                  Premium Social Media Features
                </CardTitle>
                <p className="text-sm text-gray-500">Unlock the full suite with any paid plan</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {premiumFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                      <Check className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}