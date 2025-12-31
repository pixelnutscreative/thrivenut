import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Share2, Copy, Gift, DollarSign, Award, Info, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { motion } from 'framer-motion';

export default function ShareDashboard() {
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, effectiveEmail: userEmail } = useTheme();

  // --- REFERRALS LOGIC ---
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingCode, setEditingCode] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);

  // User Prefs
  const { data: userPrefs } = useQuery({
    queryKey: ['userPrefsForReferrals', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      return prefs[0] || null;
    },
    enabled: !!userEmail,
  });

  const hasAnnualAIPlan = userPrefs?.has_annual_ai_plan || false;

  // Referral Codes
  const { data: referralData, isLoading: codesLoading } = useQuery({
    queryKey: ['referralCode', userEmail],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateReferralCode', { action: 'get' });
      return response.data;
    },
    enabled: !!userEmail,
  });

  // Source Stats Query (for dropdown)
  const { data: sourceStats } = useQuery({
    queryKey: ['referralSourceStats', userEmail],
    queryFn: async () => {
        // We need to fetch ReferralActivity but it's not exposed via standard list/filter usually for aggregation
        // But we can filter by referrer_email.
        // Since we want aggregates, we might need to fetch all activities for this user and aggregate locally
        // or add a backend function. For now, fetch latest activities.
        // Assuming base44.entities.ReferralActivity is available.
        const activities = await base44.entities.ReferralActivity.filter({ referrer_email: userEmail });
        
        // Group by referral code + source type
        const stats = {};
        activities.forEach(act => {
            const key = `${act.referral_code}`;
            if (!stats[key]) stats[key] = [];
            
            // Only add if unique combination of source_type/detail/tracking
            const sourceKey = `${act.source_type || 'direct'}-${act.source_detail || ''}-${act.tracking_identifier || ''}`;
            let existing = stats[key].find(s => s.key === sourceKey);
            if (!existing) {
                existing = {
                    key: sourceKey,
                    source_type: act.source_type || 'direct',
                    source_detail: act.source_detail,
                    tracking_identifier: act.tracking_identifier,
                    clicks: 0,
                    signups: 0,
                    upgrades: 0
                };
                stats[key].push(existing);
            }
            
            if (act.activity_type === 'click') existing.clicks++;
            if (act.activity_type === 'signup') existing.signups++;
            if (act.activity_type === 'upgrade') existing.upgrades++;
        });
        return stats;
    },
    enabled: !!userEmail
  });

  // Commissions
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

  // Assigned Coupon
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

  // Reward Levels
  const { data: rewardLevels = [] } = useQuery({
    queryKey: ['rewardLevels'],
    queryFn: () => base44.entities.ThriveReferralReward.filter({ is_active: true }, 'level')
  });

  // Points Config
  const { data: pointsConfig = [] } = useQuery({
    queryKey: ['pointsConfig'],
    queryFn: () => base44.entities.ReferralPointsConfig.filter({})
  });

  // User Verification (Referred By)
  const { data: userVerification } = useQuery({
    queryKey: ['userVerification', userEmail],
    queryFn: async () => {
      const verifications = await base44.entities.UserVerification.filter({ user_email: userEmail });
      return verifications[0] || null;
    },
    enabled: !!userEmail,
  });

  // Link Mutations
  const addCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateReferralCode', { action: 'generate' });
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
      await base44.functions.invoke('generateReferralCode', { action: 'delete', linkId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode'] });
    },
  });

  // Helpers
  const handleCopyLink = (code) => {
    const link = `https://thrive.pixelnutscreative.com?ref=${code}`;
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
    updateCodeMutation.mutate({ linkId: editingLinkId, code: editingCode, label: editingLabel });
  };

  // Stats Calcs
  const pointsPerSignup = pointsConfig.find(c => c.config_key === 'points_per_signup')?.points_value || 1;
  const pointsPerUpgrade = pointsConfig.find(c => c.config_key === 'points_per_upgrade')?.points_value || 5;
  const links = referralData?.links || [];
  const totalStats = links.reduce((acc, link) => ({
    clicks: acc.clicks + (link.stats?.clicks || 0),
    signups: acc.signups + (link.stats?.signups || 0),
    upgrades: acc.upgrades + (link.stats?.upgrades || 0)
  }), { clicks: 0, signups: 0, upgrades: 0 });
  const totalPoints = (totalStats.signups * pointsPerSignup) + (totalStats.upgrades * pointsPerUpgrade);
  const couponProgress = (commissionData?.verifiedPurchaseCount || 0) % 4;


  if (codesLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8 pb-32`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Share & Earn Dashboard</h1>
          <p className="text-gray-600">Manage your links, track your rewards, and view your commissions.</p>
        </div>

        {/* Referred By Badge */}
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

        {/* MAIN STATS OVERVIEW */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardContent className="pt-6">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Your Impact & Rewards
                </h2>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                 <p className="text-3xl font-bold text-purple-600">{totalStats.clicks}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Clicks</p>
               </div>
               <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                 <p className="text-3xl font-bold text-teal-600">{totalStats.signups}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Sign-ups</p>
               </div>
               <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                 <p className="text-3xl font-bold text-pink-600">{totalStats.upgrades}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Upgrades</p>
               </div>
               <div className="bg-white p-4 rounded-xl text-center shadow-sm border-2 border-yellow-100">
                 <p className="text-3xl font-bold text-yellow-600">{totalPoints}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reward Points</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* LINKS MANAGEMENT */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Your Referral Links
                </CardTitle>
                <CardDescription>Share these links to earn points!</CardDescription>
              </div>
              {links.length < 7 && (
                <Button 
                  size="sm" 
                  onClick={() => addCodeMutation.mutate()}
                  disabled={addCodeMutation.isPending}
                >
                  {addCodeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Create New Link
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             {links.map(link => (
                <div key={link.id} className="p-4 rounded-lg border bg-white hover:border-purple-200 transition-colors">
                  {editingLinkId === link.id ? (
                     <div className="space-y-3">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <Label>Custom Code</Label>
                           <Input 
                             value={editingCode} 
                             onChange={e => {
                               setEditingCode(e.target.value.toLowerCase());
                               setCodeError('');
                             }}
                             className="font-mono"
                             placeholder="my-code" 
                           />
                         </div>
                         <div>
                           <Label>Label</Label>
                           <Input 
                             value={editingLabel} 
                             onChange={e => setEditingLabel(e.target.value)}
                             placeholder="e.g. Instagram Bio" 
                           />
                         </div>
                       </div>
                       {codeError && <p className="text-red-500 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {codeError}</p>}
                       <div className="flex gap-2 justify-end">
                         <Button size="sm" variant="outline" onClick={() => setEditingLinkId(null)}>Cancel</Button>
                         <Button size="sm" onClick={handleSaveEdit} disabled={updateCodeMutation.isPending}>
                           {updateCodeMutation.isPending ? 'Saving...' : 'Save Changes'}
                         </Button>
                       </div>
                     </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-lg font-bold font-mono text-purple-700">{link.referral_code}</code>
                          {link.code_label && <Badge variant="secondary">{link.code_label}</Badge>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-gray-500">
                              {link.stats?.clicks || 0} clicks • {link.stats?.signups || 0} signups • {link.stats?.upgrades || 0} upgrades
                            </p>
                            
                            {/* Source Breakdown */}
                            {sourceStats && sourceStats[link.referral_code] && sourceStats[link.referral_code].length > 0 && (
                                <div className="mt-1">
                                    <Select>
                                        <SelectTrigger className="h-6 text-[10px] w-auto border-none bg-gray-50 px-2 min-w-[120px]">
                                            <SelectValue placeholder="View Sources" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sourceStats[link.referral_code].map((source, idx) => (
                                                <SelectItem key={idx} value={`source-${idx}`} disabled>
                                                    <div className="flex flex-col gap-0.5 py-1">
                                                        <span className="font-semibold text-xs">
                                                            {source.source_type === 'group_invite' ? 'Group Invite' : (source.tracking_identifier || source.source_type || 'Direct')}
                                                            {source.source_detail && <span className="font-normal text-gray-500"> ({source.source_detail})</span>}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {source.clicks} clicks, {source.signups} signups
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button size="sm" variant="outline" onClick={() => handleCopyLink(link.referral_code)}>
                           <Copy className="w-4 h-4 mr-2" /> Copy Link
                         </Button>
                         <Button size="sm" variant="ghost" onClick={() => handleStartEdit(link)}>Edit</Button>
                         {links.length > 1 && (
                           <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteCodeMutation.mutate(link.id)}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         )}
                      </div>
                    </div>
                  )}
                </div>
             ))}
          </CardContent>
        </Card>

        {/* AI TOOL COMMISSIONS */}
        {!hasAnnualAIPlan && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <DollarSign className="w-5 h-5" />
                AI Tool Commissions (22%)
              </CardTitle>
              <CardDescription>Earn credits when people buy annual AI tools via your affiliate links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Commission Credits */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-100">
                  <p className="text-sm font-semibold mb-2 text-amber-800">💰 Total Commission Credits</p>
                  <p className="text-4xl font-bold text-amber-600">
                    ${commissionData?.totalCredits?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Available to use toward AI tools</p>
                </div>

                {/* Coupon Progress */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-800">
                    <Gift className="w-4 h-4" />
                    Unlock Coupon
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${(couponProgress / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold font-mono text-blue-700">{couponProgress}/4</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Every 4 verified annual AI tool purchases unlocks a coupon.
                  </p>
                </div>
              </div>

              {/* Available Coupon */}
              {assignedCoupon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg"
                >
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
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
                    Worth ${assignedCoupon.credit_amount?.toFixed(2) || '0.00'} • Use on checkout
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* REWARDS LIST */}
        <Card>
          <CardHeader>
            <CardTitle>Rewards Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewardLevels.map(level => {
              const pointsNeeded = level.points_required || 0;
              const unlocked = totalPoints >= pointsNeeded;
              return (
                <div key={level.id} className={`p-4 rounded-lg border-l-4 ${unlocked ? 'border-l-green-500 bg-green-50/50' : 'border-l-gray-300 bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {level.reward_emoji} {level.reward_name}
                        {unlocked && <Badge className="bg-green-500">Unlocked</Badge>}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{level.reward_description}</p>
                    </div>
                    <div className="text-right">
                       <span className={`text-sm font-bold ${unlocked ? 'text-green-600' : 'text-gray-400'}`}>
                         {pointsNeeded} pts
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}