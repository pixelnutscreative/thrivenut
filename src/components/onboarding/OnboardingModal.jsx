import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Sparkles, BookOpen, Heart, Brain, User, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimezoneSelector from '../shared/TimezoneSelector';
import ColorPicker from '../shared/ColorPicker';
import ImageUploader from '../settings/ImageUploader';

const greetingTypeOptions = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse', icon: '📖' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes', icon: '✨' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!', icon: '🔥' },
  { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations', icon: '💜' }
];

const commonStruggles = [
  'ADHD / Focus', 'Anger Management', 'Anxiety', 'Autism / Sensory', 
  'Depression', 'Grief / Loss', 'Loneliness', 'Sleep Issues', 
  'Stress / Overwhelm', 'Trauma / PTSD'
];

const improvementGoals = [
  'Confidence', 'Emotional Regulation', 'Gratitude', 'Mindfulness', 
  'Motivation', 'Productivity', 'Relationships', 'Self-Care', 
  'Self-Esteem', 'Setting Boundaries'
];

function OnboardingModal({ isOpen, user, onComplete }) {
  const [step, setStep] = useState(1);
  const [customInput, setCustomInput] = useState('');
  
  // Auto-detect timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  
  const [data, setData] = useState({
    // Profile
    nickname: '',
    profile_image_url: '',
    tiktok_username: '',
    favorite_color: '#1fd2ea',
    
    // Preferences
    user_timezone: detectedTimezone,
    time_format: '12h',
    greeting_types: ['positive_quote'],
    
    // Goals
    mental_health_struggles: [],
    improvement_goals: [],
    
    // Location
    city: '',
    state: '',
    show_on_map: false,
    skip_location: false,
    
    referral_code_input: ''
  });

  // Check if user came via referral link
  const [hasReferralCode, setHasReferralCode] = useState(false);
  
  useEffect(() => {
    if (user?.full_name) {
        // Default nickname to first name
        setData(prev => ({ ...prev, nickname: user.full_name.split(' ')[0] }));
    }
    const referralCode = sessionStorage.getItem('referral_code');
    const storedData = localStorage.getItem('referral_data');
    
    if (referralCode || storedData) {
      setHasReferralCode(true);
    }
  }, [user]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Check if user is admin - skip example content for admins
      const isAdmin = user.email && ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'].includes(user.email.toLowerCase());

      // Get referral code FIRST (365-day persistence)
      let referralCode = sessionStorage.getItem('referral_code');
      
      // Check localStorage for persistent referral (365-day cookie)
      if (!referralCode) {
        try {
          const storedData = localStorage.getItem('referral_data');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            const expiresAt = new Date(parsed.expiresAt);
            if (expiresAt > new Date()) {
              referralCode = parsed.code;
            } else {
              localStorage.removeItem('referral_data'); // Expired, clean up
            }
          }
        } catch (e) {}
      }

      // Auto-create example brand, campaign, and content cards for non-admin users
      if (!isAdmin) {
        const existingBrands = await base44.entities.Brand.list();
        if (existingBrands.length === 0) {
          // Create example brand
          const exampleBrand = await base44.entities.Brand.create({
            name: 'Thrive – Example Brand',
            primary_product_service: 'Thrive Creator Platform',
            category: 'personal',
            description: 'This is an example brand to show you how Thrive works. Edit or delete it anytime!',
            owner: user.email
          });

          // Create example campaign
          const exampleCampaign = await base44.entities.PromotionCampaign.create({
            name: 'Grow With Thrive',
            campaign_type: 'tool_promotion',
            goal: 'grow',
            brand_id: exampleBrand.id,
            status: 'evergreen',
            description: 'Example campaign - edit or delete anytime!'
          });

          // Create 3 example content cards
          await base44.entities.ContentCard.bulkCreate([
            {
              title: '(Example) Why I\'m Building Thrive',
              brand_id: exampleBrand.id,
              campaign_id: exampleCampaign.id,
              content_type: 'post',
              intent: 'grow',
              status: 'idea',
              owner: user.email
            },
            {
              title: '(Example) How Thrive Helps Creators Stay Consistent',
              brand_id: exampleBrand.id,
              campaign_id: exampleCampaign.id,
              content_type: 'post',
              intent: 'authority',
              status: 'idea',
              owner: user.email
            },
            {
              title: '(Example) Share Thrive & Earn',
              brand_id: exampleBrand.id,
              campaign_id: exampleCampaign.id,
              content_type: 'post',
              intent: 'sell',
              status: 'idea',
              owner: user.email
            }
          ]);
        }
      }

      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      // Robustness: Find best existing record to update
      let targetPrefId = null;
      if (prefs.length > 0) {
        // Prefer record with data to avoid updating a ghost/empty record
        const bestMatch = prefs.find(p => p.nickname || p.profile_image_url) || prefs[0];
        targetPrefId = bestMatch.id;
      }

      const prefsData = {
        onboarding_completed: true,
        nickname: data.nickname,
        profile_image_url: data.profile_image_url,
        tiktok_username: data.tiktok_username,
        primary_color: data.favorite_color, // Use favorite color as primary for now? Or keep separate? The schema has primary_color
        favorite_color: data.favorite_color, // Profile uses this too?
        user_timezone: data.user_timezone,
        time_format: data.time_format,
        greeting_types: data.greeting_types,
        greeting_type: data.greeting_types[0],
        mental_health_struggles: data.mental_health_struggles,
        improvement_goals: data.improvement_goals,
        ...(data.skip_location ? {} : {
          location_city: data.city,
          location_state: data.state,
          show_on_map: data.show_on_map
        })
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
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          ...prefsData
        });
      }

      // Create/update profile
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

      // Initialize referral code - THIS MUST SUCCEED
      // Use link referral code first, then manual input
      const finalReferralCode = referralCode || data.referral_code_input || null;
      
      try {
        const result = await base44.functions.invoke('initializeReferralCode', { 
          referral_code: finalReferralCode 
        });
        console.log('Referral tracking result:', result);
      } catch (error) {
        console.error('Failed to track referral:', error);
        // Still continue - don't block onboarding
      }

      localStorage.setItem(`onboarding_completed_${user.email}`, 'true');
    },
    onSuccess: () => {
      onComplete();
    }
  });

  const handleNext = () => {
    if (step === 1 && data.nickname && data.user_timezone) {
      setStep(2);
    } else if (step === 2) {
      completeMutation.mutate();
    }
  };

  const canProceed = () => {
    if (step === 1) return !!data.nickname && !!data.user_timezone;
    if (step === 2) return data.skip_location || (data.city && data.state);
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        localStorage.setItem(`onboarding_completed_${user?.email}`, 'true');
        onComplete();
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 1 && 'Let\'s Get to Know You'}
            {step === 2 && 'Join Our Community Map'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                    <ImageUploader 
                        currentImage={data.profile_image_url}
                        onImageChange={(url) => setData({ ...data, profile_image_url: url })}
                        size="small"
                        label="Profile Picture (Optional)"
                    />
                </div>

                <div className="space-y-2">
                  <Label>What should we call you?</Label>
                  <Input 
                    value={data.nickname}
                    onChange={(e) => setData({ ...data, nickname: e.target.value })}
                    placeholder="Nickname or First Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Favorite Color</Label>
                  <ColorPicker
                    color={data.favorite_color}
                    onChange={(color) => setData({ ...data, favorite_color: color })}
                    label="Choose Color"
                  />
                  <p className="text-xs text-gray-500">We'll use this for your dashboard theme.</p>
                </div>

                <div>
                    <Label className="mb-2 block mt-4">Timezone & Format</Label>
                    <TimezoneSelector 
                        value={data.user_timezone} 
                        onChange={(v) => setData({ ...data, user_timezone: v })} 
                    />
                    <div className="mt-2">
                        <Select value={data.time_format} onValueChange={(v) => setData({ ...data, time_format: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                            <SelectItem value="24h">24-hour / Military (14:30)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 2: Location (Formerly Step 4) */}
          {step === 2 && (
            <>
              <p className="text-sm text-gray-600">
                We'd love to show where our Pixel Nuts community is from on a map! Your name won't show - you'll just be a dot at your city center.
              </p>

              {!data.skip_location && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value, show_on_map: true })}
                      placeholder="e.g., Nashville"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State (or Country if outside US)</Label>
                    <Input
                      value={data.state}
                      onChange={(e) => setData({ ...data, state: e.target.value, show_on_map: true })}
                      placeholder="e.g., TN or United Kingdom"
                    />
                  </div>
                </div>
              )}

              <div
                onClick={() => setData({ ...data, skip_location: !data.skip_location, show_on_map: !data.skip_location ? false : data.show_on_map })}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  data.skip_location ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={data.skip_location} />
                  <span className="font-medium text-sm">Skip - I prefer to remain anonymous</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || completeMutation.isPending}
            className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {completeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : step === 2 ? (
              "Let's Go!"
            ) : (
              'Next'
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center mb-2">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-purple-500' : s < step ? 'w-4 bg-purple-300' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Escape Hatch */}
        <div className="text-center pt-2">
          <button 
            onClick={() => {
              // Force completion in local storage
              localStorage.setItem(`onboarding_completed_${user?.email}`, 'true');
              onComplete();
            }}
            className="text-[10px] text-gray-400 hover:text-gray-600 underline"
          >
            I've already done this (Skip)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;