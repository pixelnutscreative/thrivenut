import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Share2, Copy, Gift, DollarSign, Award, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReferralsTab({ userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [customCode, setCustomCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Fetch or generate referral code
  const { data: referralData, isLoading } = useQuery({
    queryKey: ['referralCode', userEmail],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateReferralCode', { action: 'get' });
      return response.data;
    },
    enabled: !!userEmail,
  });

  // Fetch AI commission data
  const { data: commissionData } = useQuery({
    queryKey: ['commissionData', userEmail],
    queryFn: async () => {
      const purchases = await base44.entities.AIToolPurchase.filter({ referred_by_user_id: userEmail });
      const totalCredits = purchases.reduce((sum, p) => sum + (p.credit_earned || 0), 0);
      const verifiedPurchases = purchases.filter(p => p.verified);
      return {
        totalCredits,
        verifiedPurchaseCount: verifiedPurchases.length,
        pendingPurchases: purchases.filter(p => !p.verified).length
      };
    },
    enabled: !!userEmail,
  });

  // Fetch available coupon
  const { data: assignedCoupon } = useQuery({
    queryKey: ['assignedCoupon', userEmail],
    queryFn: async () => {
      const coupons = await base44.entities.CouponCode.filter({ 
        assigned_to_email: userEmail,
        is_used: false 
      });
      return coupons[0] || null;
    },
    enabled: !!userEmail,
  });

  // Fetch reward levels
  const { data: rewardLevels = [] } = useQuery({
    queryKey: ['rewardLevels'],
    queryFn: () => base44.entities.ThriveReferralReward.filter({ is_active: true }, 'level')
  });

  useEffect(() => {
    if (referralData?.referral_code) {
      setCustomCode(referralData.referral_code);
    }
  }, [referralData]);

  const updateCodeMutation = useMutation({
    mutationFn: async (newCode) => {
      const response = await base44.functions.invoke('generateReferralCode', { 
        action: 'customize', 
        customCode: newCode 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] });
      setCodeError('');
    },
    onError: (error) => {
      setCodeError(error.response?.data?.error || 'Failed to update code');
    }
  });

  const [trackingId, setTrackingId] = useState('');

  const handleCopyLink = (withTracking = false) => {
    const baseLink = `https://thrive.pixelnutscreative.com?ref=${customCode}`;
    const link = withTracking && trackingId ? `${baseLink}-${trackingId}` : baseLink;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleUpdateCode = () => {
    if (customCode.length < 3 || customCode.length > 30) {
      setCodeError('Code must be 3-30 characters');
      return;
    }
    updateCodeMutation.mutate(customCode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const stats = referralData?.stats || { clicks: 0, signups: 0, upgrades: 0 };
  const totalPoints = (stats.signups * 10) + (stats.upgrades * 50); // Placeholder values
  const couponProgress = (commissionData?.verifiedPurchaseCount || 0) % 4;
  const couponsUnlocked = Math.floor((commissionData?.verifiedPurchaseCount || 0) / 4);

  return (
    <div className="space-y-4">
      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>Share Thrive and earn points toward rewards!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Your Referral Stats
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>{stats.clicks}</p>
                <p className="text-xs text-gray-600">Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{stats.signups}</p>
                <p className="text-xs text-gray-600">Sign-ups</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.upgrades}</p>
                <p className="text-xs text-gray-600">Upgrades</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">{totalPoints}</p>
                <p className="text-xs text-gray-600">Points</p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label>Your Referral Code</Label>
            <div className="flex gap-2">
              <Input
                value={customCode}
                onChange={(e) => {
                  setCustomCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                placeholder="YOUR-CODE"
                className="font-mono text-lg"
                maxLength={30}
              />
              <Button 
                onClick={handleUpdateCode}
                disabled={updateCodeMutation.isPending || customCode === referralData?.referral_code}
              >
                {updateCodeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
            {codeError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {codeError}
              </p>
            )}
            <p className="text-xs text-gray-500">
              3-30 characters. Can include your business name!
            </p>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label>Your Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={`https://thrive.pixelnutscreative.com?ref=${customCode}`}
                readOnly
                className="bg-gray-50 font-mono text-sm"
              />
              <Button onClick={() => handleCopyLink(false)}>
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <AnimatePresence>
              {copySuccess && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-green-600 font-medium"
                >
                  ✓ Link copied to clipboard!
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Tracking Identifier */}
          <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Label className="text-sm font-semibold">📊 Track Link Source (Optional)</Label>
            <p className="text-xs text-gray-600 mb-2">
              Add a tracking ID to see which posts/platforms perform best
            </p>
            <div className="flex gap-2">
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="e.g., tiktokpost1, facebookprofile"
                className="text-sm font-mono"
              />
              <Button 
                onClick={() => handleCopyLink(true)}
                disabled={!trackingId.trim()}
                size="sm"
              >
                Copy
              </Button>
            </div>
            {trackingId && (
              <p className="text-xs text-purple-600 font-mono mt-1">
                ?ref={customCode}-{trackingId}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Examples: tiktokpost1, facebookprofile, instastory, emailsignature
            </p>
          </div>

          {/* How it Works */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              How Thrive Referrals Work
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Share your link with friends, family, or followers</li>
              <li><strong>FREE sign-ups</strong> earn you points</li>
              <li><strong>Social Add-on upgrades</strong> ($77/year) earn you MORE points</li>
              <li>Redeem points for rewards like free months, shoutouts, featured spots & more!</li>
            </ul>
          </div>

          {/* Rewards Progress */}
          {rewardLevels.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">🎯 Reward Progress</h3>
              <div className="space-y-2">
                {rewardLevels.map(level => {
                  const signupsNeeded = level.thrive_signups_required || 0;
                  const upgradesNeeded = level.social_suite_upgrades_required || 0;
                  const hasEnoughSignups = stats.signups >= signupsNeeded;
                  const hasEnoughUpgrades = stats.upgrades >= upgradesNeeded;
                  const unlocked = hasEnoughSignups && hasEnoughUpgrades;

                  return (
                    <div key={level.id} className={`p-3 rounded-lg border-2 ${unlocked ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium flex items-center gap-2">
                          <span>{level.reward_emoji || '🏆'}</span>
                          Level {level.level}: {level.reward_name}
                        </p>
                        {unlocked && <Badge className="bg-green-500">Unlocked!</Badge>}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{level.reward_description}</p>
                      <div className="space-y-1">
                        {signupsNeeded > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-teal-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((stats.signups / signupsNeeded) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono">{stats.signups}/{signupsNeeded} signups</span>
                          </div>
                        )}
                        {upgradesNeeded > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((stats.upgrades / upgradesNeeded) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono">{stats.upgrades}/{upgradesNeeded} upgrades</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Tool Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            AI Tool Commissions (22%)
          </CardTitle>
          <CardDescription>Earn credits when people buy annual AI tools via your affiliate links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Commission Credits */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
            <p className="text-sm font-semibold mb-2">💰 Total Commission Credits</p>
            <p className="text-4xl font-bold text-amber-600">
              ${commissionData?.totalCredits?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Available to use toward AI tools (no cash outs)
            </p>
          </div>

          {/* Coupon Progress */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Unlock Your Next Coupon
            </p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${(couponProgress / 4) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold font-mono">{couponProgress}/4</span>
            </div>
            <p className="text-xs text-gray-600">
              Every 4 verified annual AI tool purchases unlocks a coupon worth your total credits
            </p>
            {commissionData?.pendingPurchases > 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {commissionData.pendingPurchases} purchase(s) pending verification (2-week fraud protection)
              </p>
            )}
          </div>

          {/* Available Coupon */}
          {assignedCoupon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg"
            >
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                Your Coupon is Ready!
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 p-3 bg-white border-2 border-green-300 rounded-lg font-mono text-lg font-bold text-center">
                  {assignedCoupon.code}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(assignedCoupon.code);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Worth ${assignedCoupon.credit_amount?.toFixed(2) || '0.00'} • Use on High Level checkout
              </p>
            </motion.div>
          )}

          {/* How Commissions Work */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">How AI Tool Commissions Work</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>When someone buys <strong>Pixel's AI Toolbox</strong> or <strong>Nuts & Bots</strong> (annual only), you earn 22% in credits</li>
              <li>Every 4 verified purchases = unlock a coupon code</li>
              <li>Coupons available after 2-week refund period + onboarding verification</li>
              <li>Use credits toward your own AI subscriptions (no cash outs)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}