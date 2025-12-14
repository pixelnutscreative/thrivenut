import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Sparkles, BookOpen, Heart, Brain } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimezoneSelector from '../shared/TimezoneSelector';

const greetingTypeOptions = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse', icon: '📖' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes', icon: '✨' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!', icon: '🔥' },
  { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations', icon: '💜' }
];

const commonStruggles = [
  'ADHD', 'Anxiety', 'Depression', 'Stress', 'Focus Issues', 
  'Overwhelm', 'Low Energy', 'Sleep Problems', 'Social Anxiety', 
  'Procrastination', 'Burnout', 'Time Management'
];

function OnboardingModal({ isOpen, user, onComplete }) {
  const [step, setStep] = useState(1);
  
  // Auto-detect timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  
  const [data, setData] = useState({
    city: '',
    state: '',
    show_on_map: false,
    skip_location: false,
    user_timezone: detectedTimezone,
    time_format: '12h',
    favorite_color: '#1fd2ea',
    greeting_types: ['positive_quote'],
    mental_health_struggles: [],
    improvement_goals: [],
    referral_code_input: ''
  });

  // Check if user came via referral link
  const [hasReferralCode, setHasReferralCode] = useState(false);
  
  useEffect(() => {
    const referralCode = sessionStorage.getItem('referral_code');
    const storedData = localStorage.getItem('referral_data');
    
    if (referralCode || storedData) {
      setHasReferralCode(true);
    }
  }, []);

  const completeMutation = useMutation({
    mutationFn: async () => {
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

      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      
      const prefsData = {
        onboarding_completed: true,
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
        favorite_color: data.favorite_color
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
      try {
        const result = await base44.functions.invoke('initializeReferralCode', { 
          referral_code: referralCode 
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
    if (step === 1 && data.user_timezone) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && data.greeting_types.length > 0) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      completeMutation.mutate();
    }
  };

  const canProceed = () => {
    if (step === 1) return data.user_timezone;
    if (step === 2) return true; // Favorite color + greeting types combined
    if (step === 3) return data.greeting_types.length > 0;
    if (step === 4) return true; // Mental health is optional
    if (step === 5) return data.skip_location || (data.city && data.state);
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 1 && 'Welcome to Let\'s Thrive!'}
            {step === 2 && 'Personalize Your Experience'}
            {step === 3 && 'Daily Inspiration'}
            {step === 4 && 'What Are You Working On?'}
            {step === 5 && 'Join Our Community Map'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Step 1: Timezone */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We've detected your timezone. Update it if needed, and select your preferred time format.
              </p>
              <TimezoneSelector 
                value={data.user_timezone} 
                onChange={(v) => setData({ ...data, user_timezone: v })} 
              />
              <div className="space-y-2 mt-4">
                <Label>Time Format</Label>
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
          )}

          {/* Step 2: Favorite Color + Greeting Types Combined */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Pick your favorite color</Label>
                <p className="text-sm text-gray-600">
                  We'll use it throughout the app! Your dashboard will be called "{user?.full_name?.split(' ')[0] || 'My'}'s Day"
                </p>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={data.favorite_color}
                    onChange={(e) => setData({ ...data, favorite_color: e.target.value })}
                    className="w-16 h-16 p-1"
                  />
                  <div className="flex-1">
                    <Input
                      value={data.favorite_color}
                      onChange={(e) => setData({ ...data, favorite_color: e.target.value })}
                      placeholder="#1fd2ea"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Greeting Types */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose which types of daily inspiration you want to see (select all that apply):
              </p>
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
                        <span className="font-medium">{greeting.name}</span>
                        <p className="text-xs text-gray-500">{greeting.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 4: Mental Health / Goals */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  What are you working on? (Optional)
                </Label>
                <p className="text-xs text-gray-500 mb-3">Select ALL areas you'd like support with. You can update this anytime in Settings.</p>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
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
                        className={`p-2 rounded-lg border text-xs transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {struggle}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="mb-2">Add custom areas (optional)</Label>
                <Input
                  placeholder="Add your own (comma separated)"
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setData({
                        ...data,
                        mental_health_struggles: [...new Set([...data.mental_health_struggles, ...custom])]
                      });
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 5: Location */}
          {step === 5 && (
            <>
              <p className="text-sm text-gray-600">
                We'd love to show where our Pixel Nuts community is from on a map! Your name won't show - you'll just be a dot at your city center.
              </p>

              {!data.skip_location && (
                <>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={data.city}
                      onChange={(e) => setData({ ...data, city: e.target.value })}
                      placeholder="e.g., Nashville"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>State (or Country if outside US)</Label>
                    <Input
                      value={data.state}
                      onChange={(e) => setData({ ...data, state: e.target.value })}
                      placeholder="e.g., TN or United Kingdom"
                    />
                  </div>

                  <div
                    onClick={() => setData({ ...data, show_on_map: !data.show_on_map })}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      data.show_on_map ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={data.show_on_map} />
                      <div>
                        <span className="font-medium text-sm">Show me on the community map</span>
                        <p className="text-xs text-gray-500">Let others see your general location</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div
                onClick={() => setData({ ...data, skip_location: !data.skip_location })}
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
            ) : step === 5 ? (
              "Let's Go!"
            ) : (
              'Next'
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-purple-500' : s < step ? 'w-4 bg-purple-300' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;