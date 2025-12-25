import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gift, Check, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function RedeemGift() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Ensure user is logged in
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        // Redirect to login if not logged in, passing current URL to return to
        sessionStorage.setItem('pending_coupon', code);
        await base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const { data } = await base44.functions.invoke('redeemGift', { code: code.trim() });
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1fd2ea', '#bd84f5', '#FFD700', '#FF0000', '#00FF00'] // Festive colors
        });
        
        setTimeout(() => {
          navigate(createPageUrl('Dashboard'));
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for pending coupon from pre-login
  React.useEffect(() => {
    const pending = sessionStorage.getItem('pending_coupon');
    if (pending) {
      setCode(pending);
      sessionStorage.removeItem('pending_coupon');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Festive Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-white/10 text-6xl animate-pulse">❄️</div>
        <div className="absolute top-40 right-20 text-white/10 text-8xl animate-pulse delay-700">❄️</div>
        <div className="absolute bottom-20 left-1/4 text-white/10 text-5xl animate-pulse delay-300">🎄</div>
        <div className="absolute top-1/3 right-1/3 text-white/5 text-9xl animate-pulse delay-500">🎁</div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-4 border-yellow-400/50 bg-white/95 backdrop-blur shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500" />
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-gradient-to-br from-yellow-100 to-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-200 shadow-inner">
              <Gift className="w-10 h-10 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Redeem Your Gift
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Unlock your 1-Year All-Access Pass to Thrive Nut!
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Gift Redeemed!</h3>
                <p className="text-gray-600">
                  Welcome to the family! Redirecting you to your dashboard...
                </p>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500 mt-4" />
              </div>
            ) : (
              <form onSubmit={handleRedeem} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter your gift code (e.g. MERRY-XMAS)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-xl tracking-widest uppercase h-14 border-2 focus-visible:ring-purple-500"
                    disabled={isLoading}
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] shadow-lg"
                  disabled={isLoading || !code}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Unwrapping...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Unwrap My Gift
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-gray-400 mt-4">
                  Have questions? Contact support@pixelnutscreative.com
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}