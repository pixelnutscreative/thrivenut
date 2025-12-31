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
  'Unlimited Groups',
  'Unlimited Child Accounts',
  'Content Creator Center',
  'Personalized TikTok Analytics',
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

  // TODO: Replace with your actual Stripe Price ID for the $77/year plan
  const ANNUAL_PRICE_ID = "price_1SYCEQDB4sLI21NpDMlISc31"; 

  const handleSubscribe = async (priceId) => {
    if (!user) {
      // Save the selected plan to localStorage so we can resume after login
      localStorage.setItem('pending_plan_id', priceId);
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setLoading(true);
    try {
      // Pass the success URL to redirect back to
      const successUrl = `${window.location.origin}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = window.location.href;
      
      const response = await base44.functions.invoke('createCheckout', { 
        priceId: priceId,
        successUrl: successUrl,
        cancelUrl: cancelUrl
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(false);
    }
  };

  // Check for pending plan after login
  useEffect(() => {
    const checkPendingPlan = async () => {
      if (user && !checkingSubscription) {
        const pendingPriceId = localStorage.getItem('pending_plan_id');
        if (pendingPriceId) {
          localStorage.removeItem('pending_plan_id');
          // Auto-trigger checkout for the saved plan
          handleSubscribe(pendingPriceId);
        }
      }
    };
    checkPendingPlan();
  }, [user, checkingSubscription]);

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
            Unlock the full potential with PLUS
          </p>
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
            <div className="max-w-md mx-auto">
              {/* Annual Plan - PLUS Version */}
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
                    <CardTitle>PLUS Version</CardTitle>
                    <p className="text-sm text-gray-500">Annual Access</p>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold">$77</span>
                      <span className="text-gray-500">/year</span>
                      <p className="text-sm text-green-600 font-medium">Save $34/year!</p>
                      <p className="text-xs text-gray-400 line-through">Was $111/year</p>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(ANNUAL_PRICE_ID)}
                      disabled={loading}
                      className="w-full text-white"
                      style={gradientStyle}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get PLUS Version'}
                    </Button>
                    <ul className="text-left space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium">All Free Features Included</span>
                      </li>
                      <li className="flex items-center gap-2">
                         <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                         <span>Unlimited Groups & Child Accounts</span>
                      </li>
                      {premiumFeatures.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
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