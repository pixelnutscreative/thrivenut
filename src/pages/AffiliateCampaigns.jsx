import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Star, DollarSign, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function AffiliateCampaigns() {
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, effectiveEmail } = useTheme();

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: affiliateCampaigns = [] } = useQuery({
    queryKey: ['affiliateCampaigns'],
    queryFn: async () => {
      const all = await base44.entities.PromotionCampaign.filter({ is_affiliate_program: true }, 'name');
      return all;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['affiliateBrands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const isAnnualSubscriber = preferences?.has_annual_ai_plan || false;
  const optedInCampaigns = preferences?.opted_in_affiliate_campaigns || [];

  const handleToggleCampaign = (campaignId) => {
    const newOptedIn = optedInCampaigns.includes(campaignId)
      ? optedInCampaigns.filter(id => id !== campaignId)
      : [...optedInCampaigns, campaignId];
    
    updatePreferencesMutation.mutate({ opted_in_affiliate_campaigns: newOptedIn });
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || 'Unknown';
  };

  const productInfo = {
    thrive: {
      name: "Let's Thrive!",
      description: "All-in-One Life Management Platform",
      color: "from-teal-500 to-cyan-500",
      icon: "🎯"
    },
    pixels_toolbox: {
      name: "Pixel's AI Toolbox",
      description: "100+ AI Tools for Creators",
      color: "from-pink-500 to-amber-500",
      icon: "🎨"
    },
    nuts_bots: {
      name: "The Nuts + Bots",
      description: "Complete Business Suite",
      color: "from-purple-500 to-blue-500",
      icon: "🤖"
    }
  };

  if (!isAnnualSubscriber) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-amber-600" />
                <CardTitle className="text-amber-900">Annual Subscription Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-800">
                Affiliate campaigns are only available to annual subscribers. Upgrade to an annual plan to:
              </p>
              <ul className="list-disc list-inside text-amber-700 space-y-2">
                <li>Earn 22% commission on every sale</li>
                <li>Get your subscription FREE with just 4 referrals</li>
                <li>Access ready-made marketing content</li>
                <li>Track your earnings and referrals</li>
              </ul>
              <Button 
                onClick={() => window.location.href = '/Pricing'}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              >
                View Pricing Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Affiliate Programs</h1>
          <p className="text-gray-600">Opt into campaigns you want to promote and earn 22% commission on every sale!</p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">How It Works</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>✅ Toggle campaigns you want to promote</li>
                  <li>📱 Access ready-made content in Content Creator Center</li>
                  <li>🔗 Replace placeholders with your affiliate links</li>
                  <li>💰 Earn 22% commission on every sale</li>
                  <li>🎉 Get 4 people signed up = FREE subscription!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {affiliateCampaigns.map((campaign) => {
            const isOptedIn = optedInCampaigns.includes(campaign.id);
            const product = productInfo[campaign.affiliate_product] || {};
            
            return (
              <Card key={campaign.id} className={`${isOptedIn ? 'border-2 border-purple-400' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{product.icon}</span>
                    {isOptedIn && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${product.color} bg-opacity-10`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>{campaign.affiliate_commission_rate}% Commission</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">{campaign.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label htmlFor={`toggle-${campaign.id}`} className="text-sm font-medium">
                      {isOptedIn ? 'Promoting' : 'Opt In'}
                    </Label>
                    <Switch
                      id={`toggle-${campaign.id}`}
                      checked={isOptedIn}
                      onCheckedChange={() => handleToggleCampaign(campaign.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {affiliateCampaigns.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No affiliate campaigns available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}