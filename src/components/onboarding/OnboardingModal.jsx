import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColorPicker from '../shared/ColorPicker';
import ImageUploader from '../settings/ImageUploader';

function OnboardingModal({ isOpen, user, onComplete }) {
  const [step, setStep] = useState(1);
  
  // Auto-detect timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  
  const [data, setData] = useState({
    city: '',
    state: '',
    country: '',
    user_timezone: detectedTimezone,
    time_format: '12h',
    favorite_color: '#1fd2ea',
    profile_image_url: ''
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const isAdmin = user.email && ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'].includes(user.email.toLowerCase());

      let referralCode = sessionStorage.getItem('referral_code');
      if (!referralCode) {
        try {
          const storedData = localStorage.getItem('referral_data');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (new Date(parsed.expiresAt) > new Date()) {
              referralCode = parsed.code;
            } else {
              localStorage.removeItem('referral_data');
            }
          }
        } catch (e) {}
      }

      if (!isAdmin) {
        const existingBrands = await base44.entities.Brand.list();
        if (existingBrands.length === 0) {
          const exampleBrand = await base44.entities.Brand.create({
            name: 'Thrive – Example Brand',
            primary_product_service: 'Thrive Creator Platform',
            category: 'personal',
            description: 'This is an example brand to show you how Thrive works. Edit or delete it anytime!',
            owner: user.email
          });
          const exampleCampaign = await base44.entities.PromotionCampaign.create({
            name: 'Grow With Thrive',
            campaign_type: 'tool_promotion',
            goal: 'grow',
            brand_id: exampleBrand.id,
            status: 'evergreen',
            description: 'Example campaign - edit or delete anytime!'
          });
          await base44.entities.ContentCard.bulkCreate([
            { title: "(Example) Why I'm Building Thrive", brand_id: exampleBrand.id, campaign_id: exampleCampaign.id, content_type: 'post', intent: 'grow', status: 'idea', owner: user.email },
            { title: "(Example) How Thrive Helps Creators Stay Consistent", brand_id: exampleBrand.id, campaign_id: exampleCampaign.id, content_type: 'post', intent: 'authority', status: 'idea', owner: user.email },
            { title: "(Example) Share Thrive & Earn", brand_id: exampleBrand.id, campaign_id: exampleCampaign.id, content_type: 'post', intent: 'sell', status: 'idea', owner: user.email }
          ]);
        }
      }

      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      let targetPrefId = null;
      if (prefs.length > 0) {
        const bestMatch = prefs.find(p => p.nickname || p.profile_image_url) || prefs[0];
        targetPrefId = bestMatch.id;
      }

      const prefsData = {
        onboarding_completed: true,
        profile_image_url: data.profile_image_url,
        primary_color: data.favorite_color,
        favorite_color: data.favorite_color,
        user_timezone: data.user_timezone,
        location_city: data.city,
        location_state: data.state,
        location_country: data.country,
        time_format: data.time_format,
      };

      const profileData = {
        user_email: user.email,
        favorite_color: data.favorite_color,
      };

      if (targetPrefId) {
        await base44.entities.UserPreferences.update(targetPrefId, prefsData);
      } else {
        await base44.entities.UserPreferences.create({ user_email: user.email, ...prefsData });
      }

      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      let targetProfileId = null;
      if (profiles.length > 0) {
         const bestProfile = profiles.find(p => p.nickname || p.phone) || profiles[0];
         targetProfileId = bestProfile.id;
      }

      if (targetProfileId) {
        await base44.entities.UserProfile.update(targetProfileId, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

      const finalReferralCode = referralCode || data.referral_code_input || null;
      try {
        await base44.functions.invoke('initializeReferralCode', { referral_code: finalReferralCode });
      } catch (error) {}

      localStorage.setItem(`onboarding_completed_${user.email}`, 'true');
    },
    onSuccess: () => onComplete()
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else completeMutation.mutate();
  };

  const canProceed = () => {
    if (step === 1) return true; // location optional
    if (step === 2) return !!data.favorite_color;
    return false;
  };

  const handleClose = async () => {
    localStorage.setItem(`onboarding_completed_${user?.email}`, 'true');
    // Also save to DB so the backend knows onboarding is done
    try {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      if (prefs.length > 0) {
        await base44.entities.UserPreferences.update(prefs[0].id, { onboarding_completed: true });
      } else {
        await base44.entities.UserPreferences.create({ user_email: user.email, onboarding_completed: true });
      }
    } catch(e) {}
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <Button onClick={handleClose} variant="ghost" size="icon" className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
          <X className="h-4 w-4" />
        </Button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 1 && 'Where are you?'}
            {step === 2 && 'Make it yours'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Tell us where you are to set your timezone correctly.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} placeholder="e.g. Nashville" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} placeholder="e.g. TN" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={data.country} onChange={(e) => setData({ ...data, country: e.target.value })} placeholder="e.g. USA" />
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={data.user_timezone} onChange={(e) => setData({ ...data, user_timezone: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select value={data.time_format} onValueChange={v => setData({...data, time_format: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (13:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Favorite Color</Label>
                <ColorPicker
                  color={data.favorite_color}
                  onChange={(color) => setData({ ...data, favorite_color: color })}
                  label="Choose UI Accent Color"
                />
              </div>
              <div className="flex justify-center mt-6">
                <ImageUploader 
                  currentImage={data.profile_image_url}
                  onImageChange={(url) => setData({ ...data, profile_image_url: url })}
                  size="small"
                  label="Profile Photo (Optional)"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          ) : <div />}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {completeMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : step === 2 ? "Finish & Thrive!" : 'Next'}
          </Button>
        </div>

        <div className="flex gap-1 justify-center mt-4">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-purple-500' : s < step ? 'w-4 bg-purple-300' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;