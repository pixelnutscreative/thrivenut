import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Share2, Copy, Gift, DollarSign, Award, Sparkles, AlertTriangle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralsTab({ userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingCode, setEditingCode] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);

  // Fetch user preferences to check annual plan status
  const { data: userPrefs } = useQuery({
    queryKey: ['userPrefsForReferrals', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  const hasAnnualAIPlan = userPrefs?.has_annual_ai_plan || false;

  // Fetch all referral codes
  const { data: referralData, isLoading } = useQuery({
    queryKey: ['referralCode', userEmail],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateReferralCode', { action: 'get' });
      return response.data;
    },
    enabled: !!userEmail,
  });

  // Fetch AI commission data (only if not on annual plan)
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

  // Fetch points config
  const { data: pointsConfig = [] } = useQuery({
    queryKey: ['pointsConfig'],
    queryFn: () => base44.entities.ReferralPointsConfig.filter({})
  });

  // Fetch user's referral info (who referred them)
  const { data: userVerification } = useQuery({
    queryKey: ['userVerification', userEmail],
    queryFn: async () => {
      const verifications = await base44.entities.UserVerification.filter({ user_email: userEmail });
      return verifications[0] || null;
    },
    enabled: !!userEmail,
  });

  const pointsPerSignup = pointsConfig.find(c => c.config_key === 'points_per_signup')?.points_value || 1;
  const pointsPerUpgrade = pointsConfig.find(c => c.config_key === 'points_per_upgrade')?.points_value || 5;

  const links = referralData?.links || [];
  const totalStats = links.reduce((acc, link) => ({
    clicks: acc.clicks + (link.stats?.clicks || 0),
    signups: acc.signups + (link.stats?.signups || 0),
    upgrades: acc.upgrades + (link.stats?.upgrades || 0)
  }), { clicks: 0, signups: 0, upgrades: 0 });

  const addCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateReferralCode', { 
        action: 'generate'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] });
      setShowAddNew(false);
    },
  });

  const updateCodeMutation = useMutation({
    mutationFn: async ({ linkId, code, label }) => {
      const response = await base44.functions.invoke('generateReferralCode', { 
        action: 'customize', 
        linkId,
        customCode: code,
        codeLabel: label
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] });
      setEditingLinkId(null);
      setCodeError('');
    },
    onError: (error) => {
      setCodeError(error.response?.data?.error || 'Failed to update code');
    }
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (linkId) => {
      const response = await base44.functions.invoke('generateReferralCode', { 
        action: 'delete',
        linkId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] });
    },
  });

  const [trackingId, setTrackingId] = useState('');
  const [sourceType, setSourceType] = useState('url');
  const [sourceDetail, setSourceDetail] = useState('');
  const [showSourceTracking, setShowSourceTracking] = useState(false);

  const handleCopyLink = (code, withTracking = false) => {
    const baseLink = `https://thrive.pixelnutscreative.com?ref=${code}`;
    const fullCode = withTracking && trackingId ? `${code}-${trackingId}` : code;
    let link = `https://thrive.pixelnutscreative.com?ref=${fullCode}`;
    
    // Add source tracking params if provided
    if (sourceType) {
      link += `&source_type=${sourceType}`;
    }
    if (sourceDetail) {
      link += `&source_detail=${encodeURIComponent(sourceDetail)}`;
    }
    
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStartEdit = (link) => {
    setEditingLinkId(link.id);
    setEditingCode(link.referral_code);
    setEditingLabel(link.code_label || '');
    setCodeError('');
  };

  const handleSaveEdit = () => {
    if (editingCode.length < 3 || editingCode.length > 30) {
      setCodeError('Code must be 3-30 characters');
      return;
    }
    updateCodeMutation.mutate({ 
      linkId: editingLinkId, 
      code: editingCode,
      label: editingLabel 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const totalPoints = (totalStats.signups * pointsPerSignup) + (totalStats.upgrades * pointsPerUpgrade);
  const couponProgress = (commissionData?.verifiedPurchaseCount || 0) % 4;
  const couponsUnlocked = Math.floor((commissionData?.verifiedPurchaseCount || 0) / 4);

  return (
    <div className="space-y-4">
      {/* Referred By Section */}
      {userVerification?.referred_by_code && (
        <Card className="border-teal-300 bg-teal-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xl">
                🎁
              </div>
              <div>
                <p className="text-sm text-teal-700 font-medium">You joined through a referral!</p>
                <p className="text-xs text-teal-600">
                  Referral code: <code className="bg-white px-2 py-0.5 rounded font-mono font-semibold">{userVerification.referred_by_code}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          {/* Overall Stats */}
          <div className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Total Referral Stats (All Codes)
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: primaryColor }}>{totalStats.clicks}</p>
                <p className="text-xs text-gray-600">Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">{totalStats.signups}</p>
                <p className="text-xs text-gray-600">Sign-ups</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{totalStats.upgrades}</p>
                <p className="text-xs text-gray-600">Upgrades</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">{totalPoints}</p>
                <p className="text-xs text-gray-600">Points</p>
              </div>
            </div>
          </div>

          {/* Referral Codes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Your Referral Codes ({links.length}/7)</Label>
              {links.length < 7 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addCodeMutation.mutate()}
                  disabled={addCodeMutation.isPending}
                >
                  {addCodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                  Add Code
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Codes are NOT case sensitive • All lowercase for simplicity
            </p>

            {links.map(link => (
              <Card key={link.id} className="border-2">
                <CardContent className="pt-4">
                  {editingLinkId === link.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Code</Label>
                        <Input
                          value={editingCode}
                          onChange={(e) => {
                            setEditingCode(e.target.value.toLowerCase());
                            setCodeError('');
                          }}
                          placeholder="your-code"
                          className="font-mono"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Label (Optional)</Label>
                        <Input
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          placeholder="e.g., TikTok, Instagram, Email"
                          maxLength={30}
                        />
                      </div>
                      {codeError && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {codeError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateCodeMutation.isPending}>
                          {updateCodeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingLinkId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-lg font-bold font-mono">{link.referral_code}</code>
                            {link.code_label && (
                              <Badge variant="secondary" className="text-xs">{link.code_label}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div>
                              <span className="text-gray-500">Clicks:</span> <span className="font-semibold">{link.stats?.clicks || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Signups:</span> <span className="font-semibold">{link.stats?.signups || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Upgrades:</span> <span className="font-semibold">{link.stats?.upgrades || 0}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleCopyLink(link.referral_code)}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy Link
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStartEdit(link)}>
                              Edit
                            </Button>
                            {links.length > 1 && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-600"
                                onClick={() => deleteCodeMutation.mutate(link.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Tracking Section */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">📊 Enhanced Link Tracking</Label>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setShowSourceTracking(!showSourceTracking)}
              >
                {showSourceTracking ? 'Hide' : 'Show'} Options
              </Button>
            </div>

            {showSourceTracking && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs mb-1 block">Tracking ID (Optional)</Label>
                  <Input
                    placeholder="e.g., tiktok1, email-series1, instagram-story"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adds -trackingId to your code (e.g., pixel-tiktok1)
                  </p>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Where are you sharing this?</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">🔗 Website/URL</SelectItem>
                      <SelectItem value="social_post">📱 Social Media Post</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="text">💬 Text Message</SelectItem>
                      <SelectItem value="print">🖨️ Printed Material</SelectItem>
                      <SelectItem value="other">✨ Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Source Details (Optional)</Label>
                  <Input
                    placeholder={
                      sourceType === 'url' ? 'https://yourwebsite.com/blog-post' :
                      sourceType === 'email' ? 'Email Campaign: Newsletter #3' :
                      sourceType === 'social_post' ? 'TikTok Post about Goals Feature' :
                      sourceType === 'text' ? 'Text to my VIP list' :
                      'Brief description of where this link is'
                    }
                    value={sourceDetail}
                    onChange={(e) => setSourceDetail(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add a URL, description, or note about this specific placement
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700 mb-1">Your enhanced link will include:</p>
                  <code className="text-xs text-gray-600 break-all">
                    ?ref=yourcode{trackingId && `-${trackingId}`}{sourceType && `&source_type=${sourceType}`}{sourceDetail && `&source_detail=${encodeURIComponent(sourceDetail)}`}
                  </code>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600">
              💡 Track exactly which posts, emails, or campaigns bring the most signups!
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
              <li><strong>FREE sign-ups</strong> earn you {pointsPerSignup} point{pointsPerSignup !== 1 ? 's' : ''} each</li>
              <li><strong>Social Add-on upgrades</strong> ($77/year) earn you {pointsPerUpgrade} point{pointsPerUpgrade !== 1 ? 's' : ''} each</li>
              <li>Redeem points for rewards like free months, shoutouts, featured spots & more!</li>
            </ul>
          </div>

          {/* Rewards Progress */}
          {rewardLevels.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">🎯 Reward Progress</h3>
              <div className="space-y-2">
                {rewardLevels.map(level => {
                  const pointsNeeded = level.points_required || 0;
                  const unlocked = totalPoints >= pointsNeeded;

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
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((totalPoints / pointsNeeded) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold">{totalPoints}/{pointsNeeded} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Tool Commissions (hidden if annual plan) */}
      {!hasAnnualAIPlan && (
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
      )}
    </div>
  );
}