import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Star, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';

export default function TikTokAccessGate({ isOpen, onClose }) {
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planType) => {
    setLoading(planType);
    try {
      const response = await base44.functions.invoke('createCheckout', { plan_type: planType });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock TikTok Features</h2>
          <p className="text-gray-600 mb-6">
            Get access to TikTok content goals, engagement tracking, gifter songs, and more!
          </p>

          <div className="space-y-3">
            {/* Holiday Special */}
            <div className="p-3 bg-gradient-to-r from-red-50 to-green-50 rounded-lg border border-red-200 mb-4">
              <p className="text-sm font-semibold text-red-700">🎄 Holiday Special - Ends Dec 7th!</p>
            </div>

            {/* 7-Month Option */}
            <Button 
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              variant="outline"
              className="w-full border-2 border-teal-300 hover:border-teal-500 hover:bg-teal-50"
            >
              {loading === 'monthly' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              $49 for 7 months
            </Button>

            {/* Annual Option - Best Value */}
            <Button 
              onClick={() => handleSubscribe('annual')}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading === 'annual' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              $77/year (Sale! Regularly $111)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}