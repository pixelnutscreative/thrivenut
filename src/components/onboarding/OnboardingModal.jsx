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

      if (prefs[0]) {
        await base44.entities.UserPreferences.update(prefs[0].id, prefsData);
      } else {
        await base44.entities.UserPreferences.create({
          user_email: user.email,
          ...prefsData
        });
      }

      // Create/update profile
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, profileData);
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
    if (step === 1 && data.nickname) {
      setStep(2);
    } else if (step === 2 && data.user_timezone && data.greeting_types.length > 0) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      completeMutation.mutate();
    }
  };

  const canProceed = () => {
    if (step === 1) return !!data.nickname;
    if (step === 2) return data.user_timezone && data.greeting_types.length > 0;
    if (step === 3) return true; // Mental health is optional
    if (step === 4) return data.skip_location || (data.city && data.state);
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 1 && 'Let\'s Get to Know You'}
            {step === 2 && 'Your Preferences'}
            {step === 3 && 'What Are You Working On?'}
            {step === 4 && 'Join Our Community Map'}
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
                  <Label>TikTok Username (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                    <Input 
                      value={data.tiktok_username}
                      onChange={(e) => setData({ ...data, tiktok_username: e.target.value.replace('@', '') })}
                      placeholder="username"
                      className="pl-7"
                    />
                  </div>
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
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                    <Label className="mb-2 block">Timezone & Format</Label>
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

                <div>
                    <Label className="mb-2 block">Daily Inspiration</Label>
                    <p className="text-xs text-gray-500 mb-3">Choose what you want to see daily (select all that apply):</p>
                    <div className="grid grid-cols-1 gap-2">
                        {greetingTypeOptions.map(greeting => {
                            const isSelected = data.greeting_types.includes(greeting.id);
                            return (
                            <div
                                key={greeting.id}
                                onClick={() => {
                                const current = data.greeting_types;
                                const newTypes = isSelected
                                    ? current.filter(t => t !== greeting.id)
                                    : [...current, greeting.id];
                                if (newTypes.length > 0) {
                                    setData({ ...data, greeting_types: newTypes });
                                }
                                }}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                <Checkbox checked={isSelected} />
                                <span>{greeting.icon}</span>
                                <div>
                                    <span className="font-medium text-sm">{greeting.name}</span>
                                </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Mental Health / Goals */}
          {step === 3 && (
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">What You're Working On</h3>
              </div>
              <p className="text-xs text-gray-500 -mt-4 mb-4">
                This helps personalize your affirmations and AI support. 100% private. 💜
              </p>

              {/* Struggles */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Things I'm working through...</Label>
                <div className="flex flex-wrap gap-2">
                  {commonStruggles.map(struggle => {
                    const isSelected = data.mental_health_struggles.includes(struggle);
                    return (
                      <button
                        key={struggle}
                        onClick={() => {
                          const current = data.mental_health_struggles;
                          setData({
                            ...data,
                            mental_health_struggles: isSelected
                              ? current.filter(s => s !== struggle)
                              : [...current, struggle]
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                          isSelected 
                            ? 'border-orange-200 bg-orange-50 text-orange-700' 
                            : 'border-gray-200 hover:border-orange-200'
                        }`}
                      >
                        {isSelected && <span className="mr-1">😓</span>}
                        {struggle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Improvements */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Things I want to improve...</Label>
                <div className="flex flex-wrap gap-2">
                  {improvementGoals.map(goal => {
                    const isSelected = data.improvement_goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          const current = data.improvement_goals;
                          setData({
                            ...data,
                            improvement_goals: isSelected
                              ? current.filter(g => g !== goal)
                              : [...current, goal]
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                          isSelected 
                            ? 'border-blue-200 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✨</span>}
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom */}
              <div>
                <Label className="mb-2 block text-sm">Custom Items I'm Working On</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customInput.trim()) {
                        e.preventDefault();
                        const newItem = customInput.trim();
                        if (!data.mental_health_struggles.includes(newItem)) {
                          setData({
                            ...data,
                            mental_health_struggles: [...data.mental_health_struggles, newItem]
                          });
                        }
                        setCustomInput('');
                      }
                    }}
                    placeholder="Add custom item (e.g. 'Burnout')"
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0"
                    onClick={() => {
                      if (customInput.trim()) {
                        const newItem = customInput.trim();
                        if (!data.mental_health_struggles.includes(newItem)) {
                          setData({
                            ...data,
                            mental_health_struggles: [...data.mental_health_struggles, newItem]
                          });
                        }
                        setCustomInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                
                {/* Display custom added items */}
                {data.mental_health_struggles.filter(s => !commonStruggles.includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.mental_health_struggles.filter(s => !commonStruggles.includes(s)).map(custom => (
                      <button
                        key={custom}
                        onClick={() => {
                          setData({
                            ...data,
                            mental_health_struggles: data.mental_health_struggles.filter(s => s !== custom)
                          });
                        }}
                        className="px-3 py-1.5 rounded-full border text-xs bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1 hover:bg-purple-100"
                      >
                        {custom} <span className="text-[10px] ml-1">×</span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-gray-400 mt-1">
                  Add your own custom items. Once submitted, admin can add them to the global list for others.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
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
            ) : step === 4 ? (
              "Let's Go!"
            ) : (
              'Next'
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center mb-2">
          {[1, 2, 3, 4].map(s => (
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