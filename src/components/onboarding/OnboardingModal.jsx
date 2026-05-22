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
    // Step 1
    nickname: '',
    address_as: '',
    custom_title: '',
    
    // Step 2
    city: '',
    state: '',
    user_timezone: detectedTimezone,
    
    // Step 3
    favorite_color: '#1fd2ea',
    tiktok_username: '',
    profile_image_url: '',
    
    // Step 4
    superpower: '',
    current_battle: '',
    
    // Step 5
    enable_bible_options: false,
    
    referral_code_input: ''
  });

  useEffect(() => {
    if (user?.full_name && !data.nickname) {
        setData(prev => ({ ...prev, nickname: user.full_name.split(' ')[0] }));
    }
  }, [user]);

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
        nickname: data.nickname,
        address_as: data.address_as === 'custom' ? data.custom_title : data.address_as,
        profile_image_url: data.profile_image_url,
        tiktok_username: data.tiktok_username,
        primary_color: data.favorite_color,
        favorite_color: data.favorite_color,
        user_timezone: data.user_timezone,
        location_city: data.city,
        location_state: data.state,
        superpowers: data.superpower,
        current_battles: data.current_battle,
        enable_bible_options: data.enable_bible_options,
        time_format: '12h',
      };

      const profileData = {
        user_email: user.email,
        favorite_color: data.favorite_color,
        tiktok_username: data.tiktok_username,
        nickname: data.nickname
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
    if (step < 5) setStep(step + 1);
    else completeMutation.mutate();
  };

  const canProceed = () => {
    if (step === 1) return !!data.nickname && !!data.address_as && (data.address_as !== 'custom' || !!data.custom_title);
    if (step === 2) return true; // Location is optional
    if (step === 3) return !!data.favorite_color;
    if (step === 4) return true; // Superpower & battle optional
    if (step === 5) return true;
    return false;
  };

  const handleClose = () => {
    localStorage.setItem(`onboarding_completed_${user?.email}`, 'true');
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
            {step === 1 && 'Who are you?'}
            {step === 2 && 'Where are you?'}
            {step === 3 && 'Make it yours'}
            {step === 4 && 'Your superpowers & battles'}
            {step === 5 && 'Your vibe'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What's your name / what do you want to be called?</Label>
                <Input 
                  value={data.nickname}
                  onChange={(e) => setData({ ...data, nickname: e.target.value })}
                  placeholder="e.g. Sarah"
                />
              </div>
              <div className="space-y-2">
                <Label>Choose your title</Label>
                <Select value={data.address_as} onValueChange={v => setData({...data, address_as: v})}>
                  <SelectTrigger><SelectValue placeholder="Select a title" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Queen 👑">Queen 👑</SelectItem>
                    <SelectItem value="Princess 🌸">Princess 🌸</SelectItem>
                    <SelectItem value="King 👑">King 👑</SelectItem>
                    <SelectItem value="custom">Type your own...</SelectItem>
                  </SelectContent>
                </Select>
                {data.address_as === 'custom' && (
                  <Input 
                    value={data.custom_title}
                    onChange={e => setData({...data, custom_title: e.target.value})}
                    placeholder="Enter your custom title"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Tell us where you are so we can set your timezone correctly.</p>
              <div className="space-y-2">
                <Label>City / State</Label>
                <Input
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  placeholder="e.g., Nashville, TN"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Favorite Color</Label>
                <ColorPicker
                  color={data.favorite_color}
                  onChange={(color) => setData({ ...data, favorite_color: color })}
                  label="Choose UI Accent Color"
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok Handle (Optional)</Label>
                <Input
                  value={data.tiktok_username}
                  onChange={(e) => setData({ ...data, tiktok_username: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="flex justify-center">
                <ImageUploader 
                  currentImage={data.profile_image_url}
                  onImageChange={(url) => setData({ ...data, profile_image_url: url })}
                  size="small"
                  label="Profile Photo (Optional)"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">This helps personalize your daily motivation and AI interactions.</p>
              <div className="space-y-2">
                <Label>I have the superpower of...</Label>
                <Input 
                  value={data.superpower}
                  onChange={(e) => setData({ ...data, superpower: e.target.value })}
                  placeholder="e.g. Creativity, ADHD, Stubbornness"
                />
              </div>
              <div className="space-y-2">
                <Label>I'm currently battling...</Label>
                <Input 
                  value={data.current_battle}
                  onChange={(e) => setData({ ...data, current_battle: e.target.value })}
                  placeholder="e.g. Procrastination, Self-doubt"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg hover:border-purple-300 cursor-pointer transition-all" onClick={() => setData({...data, enable_bible_options: true})}>
                <div className="flex items-center gap-3">
                  <input type="radio" checked={data.enable_bible_options === true} onChange={() => {}} />
                  <div>
                    <div className="font-medium">YES, include Scripture</div>
                    <div className="text-xs text-gray-500">I'd love Bible verses in my daily motivation & quotes.</div>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:border-purple-300 cursor-pointer transition-all" onClick={() => setData({...data, enable_bible_options: false})}>
                <div className="flex items-center gap-3">
                  <input type="radio" checked={data.enable_bible_options === false} onChange={() => {}} />
                  <div>
                    <div className="font-medium">NO, keep it general</div>
                    <div className="text-xs text-gray-500">I prefer general positive quotes and motivation.</div>
                  </div>
                </div>
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
            ) : step === 5 ? "Finish & Thrive!" : 'Next'}
          </Button>
        </div>

        <div className="flex gap-1 justify-center mt-4">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-purple-500' : s < step ? 'w-4 bg-purple-300' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;