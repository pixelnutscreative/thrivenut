import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Star, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';

export default function TikTokAccessGate({ isOpen, onClose }) {
  const [loading, setLoading] = useState(null);

  // TODO: Replace with actual $77 Price ID
  const PLUS_PLAN_PRICE_ID = "price_1SYCEQDB4sLI21NpDMlISc31"; 

  const handleSubscribe = async () => {
    setLoading('annual');
    try {
      const response = await base44.functions.invoke('createCheckout', { 
        priceId: PLUS_PLAN_PRICE_ID,
        successUrl: `${window.location.origin}/SubscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href
      });
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock Plus Plan</h2>
          <p className="text-gray-600 mb-6">
            Get access to the full Social Media Suite, TikTok tools, and unlimited features!
          </p>

          <div className="space-y-3">
            <Button 
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
            >
              {loading === 'annual' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              Upgrade to Plus - $77/year
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Includes 7-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}