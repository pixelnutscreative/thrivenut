import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';

export default function SubscriptionSuccess() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const { isDark, bgClass, primaryColor, accentColor } = useTheme();

  useEffect(() => {
    const checkSub = async () => {
      try {
        // First check if user is logged in
        const user = await base44.auth.me();
        if (!user) {
          // Not logged in - just show success without subscription details
          setLoading(false);
          return;
        }
        
        const response = await base44.functions.invoke('checkSubscription');
        if (response.data?.hasActiveSubscription) {
          setSubscription(response.data.subscription);
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for Stripe to process
    setTimeout(checkSub, 2000);
  }, []);

  const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` };

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
            <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
            <p className="text-gray-600">Just a moment while we confirm everything!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full">
          <div className="h-2 rounded-t-lg" style={gradientStyle} />
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="w-12 h-12" style={{ color: primaryColor }} />
            </motion.div>

            <h1 className="text-2xl font-bold mb-2">Welcome to Let's Thrive! 🎉</h1>
            <p className="text-gray-600 mb-6">
              Your subscription is now active. You have full access to all premium features!
            </p>

            {subscription && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Your Plan Details:</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Plan:</span> {subscription.plan_type === 'annual' ? 'Annual' : 'Monthly'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> {subscription.status}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link to={createPageUrl('Dashboard')} className="block">
                <Button className="w-full text-white" style={gradientStyle}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to={createPageUrl('Settings')} className="block">
                <Button variant="outline" className="w-full">
                  Customize Your Experience
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}