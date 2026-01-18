import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, User, Palette, Layers, MessageSquare, Zap, BookOpen, Shirt, Gift, Share2, Sparkles, Plus, Trash2, Briefcase, Check, Code, ExternalLink, UserX, Calendar as CalendarIcon, Sliders, PuzzleIcon, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ColorPicker from '../components/shared/ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';

import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import FeatureOrderManager from '../components/settings/FeatureOrderManager';
import DashboardPreferences from '../components/settings/DashboardPreferences';
import QuickActionsSettings from '../components/settings/QuickActionsSettings';
import SoundCloudSettings from '../components/settings/SoundCloudSettings';
import MoodEmojiSettings from '../components/settings/MoodEmojiSettings';
import WidgetSettingsV2 from '../components/settings/WidgetSettingsV2';

// ReferralsTab removed

import AIPersonalitySettings from '../components/settings/AIPersonalitySettings';
import AddressingPreferences from '../components/settings/AddressingPreferences';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import People from './People';


const AFFILIATE_TAG = 'pixelnuts-20';

const greetingTypeOptions = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse', icon: '📖' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes', icon: '✨' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!', icon: '🔥' },
  { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations', icon: '💜' }
];

const pageOptions = [
  { id: 'Dashboard', name: 'Dashboard' },
  { id: 'Goals', name: 'Goals' },
  { id: 'Wellness', name: 'Wellness' },
  { id: 'Journal', name: 'Journal' },
  { id: 'TikTokContacts', name: 'Creator Contacts' },
  { id: 'LiveSchedule', name: 'Content Calendar' },
  { id: 'TikTokEngagement', name: 'Social Engagement' },
  { id: 'PixelsParadise', name: "Pixel's Place" },
  { id: 'CustomHomepage', name: 'My Custom Homepage' },
];

const bibleVersions = [
  { id: 'NIV', name: 'NIV (New International Version)' },
  { id: 'ESV', name: 'ESV (English Standard Version)' },
  { id: 'NKJV', name: 'NKJV (New King James Version)' },
  { id: 'NLT', name: 'NLT (New Living Translation)' },
  { id: 'NASB', name: 'NASB (New American Standard)' },
  { id: 'KJV', name: 'KJV (King James Version)' },
  { id: 'AMP', name: 'AMP (Amplified Bible)' },
  { id: 'custom', name: 'Custom Translation' }
];

export default function Settings() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const isSavingAll = saveStatus === 'saving';
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preferences');
  const [expandedTabs, setExpandedTabs] = useState(['preferences']);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email)?.toLowerCase() : null;

  // Add this key prop to force remount when user changes
  const settingsKey = `settings-${effectiveEmail || 'none'}`;

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      // If multiple records exist, prefer the one with data (e.g. nickname)
      // This prevents empty accidental duplicates from shadowing the real data
      if (prefs.length > 1) {
        const withData = prefs.find(p => p.nickname || p.profile_image_url || (p.enabled_modules && p.enabled_modules.length > 0));
        if (withData) return withData;
      }
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache at all for settings
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', effectiveEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: effectiveEmail });
      // Prefer profile with data
      if (profiles.length > 1) {
        const withData = profiles.find(p => p.phone || p.nickname || (p.social_links && Object.values(p.social_links).some(v => v)));
        if (withData) return withData;
      }
      return profiles[0] || null;
    },
    enabled: !!effectiveEmail,
    refetchOnWindowFocus: false, // Prevent overwriting user edits on tab switch
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [prefData, setPrefData] = useState({});
  const [profileData, setProfileData] = useState({
    clothing_sizes: {},
    interests: '',
    wish_list: [],
    beauty_profile: {},
    style_profile: {},
    favorite_color: '',
    recovery_date: '',
    military_branch: '',
    social_links: {},
    privacy_settings: {
      share_sizes: true,
      share_wishlist: true,
      share_socials: true,
      share_recovery: true,
      share_military: true,
      share_color: true,
      share_creator_info: true
    },
    allow_sharing: true,
    // Creator fields
    phonetic: '',
    role: [],
    creator_notes: '',
    calendar_enabled: false,
    is_gifter: false,
    live_stream_types: [],
    live_agency: '',
    shop_agency: '',
    started_going_live: '',
    clubs: [],
    custom_clubs: []
  });

  // Track if we've initialized data to prevent overwriting user edits
  const [prefsInitialized, setPrefsInitialized] = useState(false);
  const [profileInitialized, setProfileInitialized] = useState(false);

  // Always sync backend data to form when it arrives
  useEffect(() => {
    if (preferences) {
      setPrefData(prev => ({
        ...prev,
        ...preferences,
        // Explicitly preserve defaults if backend doesn't have them
        user_timezone: preferences.user_timezone || prev.user_timezone || 'America/Los_Angeles',
        time_format: preferences.time_format || prev.time_format || '12h',
        default_landing_page: preferences.default_landing_page || prev.default_landing_page || 'Dashboard',
        // Add any other fields that need defaults
      }));
    }
  }, [preferences]);

  // Always sync backend profile data
  useEffect(() => {
    if (userProfile) {
      setProfileData(prev => ({
        ...prev,
        ...userProfile,
        // Preserve defaults for nested objects
        clothing_sizes: userProfile.clothing_sizes || prev.clothing_sizes || {},
        privacy_settings: {
          share_sizes: true,
          share_wishlist: true,
          share_socials: true,
          share_recovery: true,
          share_military: true,
          share_color: true,
          share_creator_info: true,
          ...userProfile.privacy_settings,
          ...prev.privacy_settings
        },
        // Add other nested defaults as needed
      }));
    }
  }, [userProfile]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = { ...data };
      
      // Remove system fields that shouldn't be updated manually
      delete cleanData.id;
      delete cleanData.created_date;
      delete cleanData.updated_date;
      delete cleanData.created_by;
      
      console.log('📤 SAVING PREFERENCES:', { effectiveEmail, cleanData });
      
      // Always use filter-based update (correct SDK signature)
      const existing = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      
      if (existing.length > 0) {
        const result = await base44.entities.UserPreferences.update(existing[0].id, cleanData);
        console.log('✅ PREFERENCES UPDATED:', result);
        return result;
      } else {
        const result = await base44.entities.UserPreferences.create({
          user_email: effectiveEmail,
          ...cleanData,
          onboarding_completed: true
        });
        console.log('✅ PREFERENCES CREATED:', result);
        return result;
      }
    },
    onSuccess: async () => {
      console.log('🔄 INVALIDATING & REFETCHING CACHE');
      // Critical: Invalidate cache immediately
      await queryClient.invalidateQueries({ queryKey: ['preferences', effectiveEmail] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', effectiveEmail] });
      await queryClient.invalidateQueries({ queryKey: ['platformConfig'] });
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['preferences', effectiveEmail] });
    },
    onError: (error) => {
      console.error('❌ PREFERENCES SAVE FAILED:', error);
    }
  });

  const updateUserProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Double check for existing record to prevent duplicates
      const existing = await base44.entities.UserProfile.filter({ user_email: effectiveEmail });
      let targetId = null;
      
      if (existing.length > 0) {
        // Find best match if multiple
        const bestMatch = existing.find(p => p.phone || p.nickname) || existing[0];
        targetId = bestMatch.id;
      }

      const idToUpdate = userProfile?.id || targetId;
      if (idToUpdate) {
        return await base44.entities.UserProfile.update(idToUpdate, data);
      } else {
        return await base44.entities.UserProfile.create({
          user_email: effectiveEmail,
          ...data
        });
      }
    },
    onSuccess: async () => {
      // Critical: Invalidate cache immediately
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user?.email?.toLowerCase()] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile', effectiveEmail] });
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ['userProfile', effectiveEmail] });
    },
    onError: (error) => {
      console.error('Save error:', error);
    }
  });

  const handleSave = async () => {
    setSaveStatus('saving');
    const promises = [];
    
    console.log('💾 SAVE INITIATED - Preferences & Profile', { prefData, profileData });
    
    // Always save if we have data, regardless of whether record exists (mutation handles create)
    if (prefData && Object.keys(prefData).length > 0) {
      promises.push(updatePreferencesMutation.mutateAsync(prefData));
    }
    
    // Always save profile data
    if (profileData) {
      promises.push(updateUserProfileMutation.mutateAsync(profileData));
    }
    
    try {
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        console.log('✅ ALL SAVES SUCCESSFUL:', results);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        console.warn('⚠️ NO DATA TO SAVE');
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error("❌ ERROR SAVING SETTINGS:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved!';
      case 'error': return 'Error!';
      default: return 'Save Changes';
    }
  };

  const getSaveButtonIcon = () => {
    if (saveStatus === 'saving') return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (saveStatus === 'saved') return <Check className="w-4 h-4 mr-2" />;
    return <Save className="w-4 h-4 mr-2" />;
  };

  const getSaveButtonVariant = () => {
    if (saveStatus === 'saved') return 'default'; // Or a success color if we had one defined in variants
    if (saveStatus === 'error') return 'destructive';
    return 'default';
  };

  const getSaveButtonStyle = () => {
    if (saveStatus === 'saved') return { backgroundColor: '#22c55e', borderColor: '#22c55e' }; // Green-500
    return {};
  };

  const updateProfileNested = (category, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const addWishItem = () => {
    setProfileData(prev => ({
      ...prev,
      wish_list: [...prev.wish_list, { item: '', link: '', notes: '' }]
    }));
  };

  const updateWishItem = (index, field, value) => {
    let finalValue = value;
    if (field === 'link' && (value.includes('amazon.com') || value.includes('amzn.to'))) {
      if (!value.includes('tag=')) {
        const separator = value.includes('?') ? '&' : '?';
        finalValue = `${value}${separator}tag=${AFFILIATE_TAG}`;
      }
    }

    const newList = [...profileData.wish_list];
    newList[index] = { ...newList[index], [field]: finalValue };
    setProfileData(prev => ({ ...prev, wish_list: newList }));
  };

  const removeWishItem = (index) => {
    setProfileData(prev => ({
      ...prev,
      wish_list: prev.wish_list.filter((_, i) => i !== index)
    }));
  };

  const { bgClass, primaryColor, accentColor } = useTheme();

  if (loading || prefsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div key={settingsKey} className={`min-h-screen ${bgClass} p-4 md:p-8 pb-32`}>
      <OnboardingModal 
        isOpen={showOnboarding} 
        user={user} 
        onComplete={() => {
          setShowOnboarding(false);
          queryClient.invalidateQueries({ queryKey: ['preferences'] });
        }} 
      />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOnboarding(true)}
              className="hidden md:flex"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Re-run Onboarding
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { 
          // Auto-save removed
          setActiveTab(v); 
          navigate(`#${v}`); 
        }} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 mb-6 bg-transparent h-auto">
            {['preferences', 'dashboard', 'features'].map(tab => {
              let icon, label;
              switch(tab) {
                case 'preferences': icon = <Sliders className="w-4 h-4" />; label = 'Preferences'; break;
                case 'dashboard': icon = <CalendarIcon className="w-4 h-4" />; label = 'Dashboard'; break;
                case 'features': icon = <PuzzleIcon className="w-4 h-4" />; label = 'Customize'; break;
              }
              
              const isActive = activeTab === tab;
              
              return (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className="flex flex-col items-center gap-1 h-auto py-2 data-[state=active]:text-white transition-all duration-300"
                  style={isActive ? { 
                    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                    border: 'none'
                  } : {}}
                >
                  {icon}
                  <span className="text-[10px] font-medium">{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>



          {/* CUSTOMIZE TAB (Combined Features + Widgets) */}
          <TabsContent value="features">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={isSavingAll}>
                <Save className="w-4 h-4 mr-2" />
                {isSavingAll ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Quick Actions / Widgets Section */}
              <WidgetSettingsV2 formData={prefData} setFormData={setPrefData} />

              {/* Collapsible Features Section */}
              <Card>
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 hover:bg-gray-50 transition-colors rounded-t-xl cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Layers className="w-5 h-5 text-purple-600" />
                           <div>
                             <CardTitle className="text-lg">Enable / Disable Features</CardTitle>
                             <CardDescription>Control which modules appear in your menu</CardDescription>
                           </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <FeatureOrderManager enabledModules={prefData.enabled_modules} onChange={(updates) => setPrefData({ ...prefData, ...updates })} />
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </TabsContent>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={isSavingAll}>
                <Save className="w-4 h-4 mr-2" />
                {isSavingAll ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <DashboardPreferences formData={prefData} setFormData={setPrefData} />
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences">
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOnboarding(true)}
              className="md:hidden"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Re-run Onboarding
            </Button>
            <Button onClick={handleSave} disabled={isSavingAll}>
              <Save className="w-4 h-4 mr-2" />
              {isSavingAll ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Theme & Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeSelector themeData={prefData} onChange={(data) => setPrefData({ ...prefData, ...data })} />
              </CardContent>
            </Card>

            <AddressingPreferences formData={prefData} setFormData={setPrefData} />
            <AIPersonalitySettings formData={prefData} setFormData={setPrefData} />
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">General Preferences</CardTitle>
                <CardDescription>Time, language, and other general settings.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="mb-2 block">Timezone</Label>
                  <TimezoneSelector value={prefData.user_timezone} onChange={(val) => setPrefData({ ...prefData, user_timezone: val })} />
                </div>
                <div>
                  <Label className="mb-2 block">Time Format</Label>
                  <Select value={prefData.time_format || '12h'} onValueChange={(v) => setPrefData({ ...prefData, time_format: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM) - Example: 2:30 PM</SelectItem>
                      <SelectItem value="24h">24-hour (Military) - Example: 14:30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <Label className="mb-2 block">Landing Page</Label>
                <Select value={prefData.default_landing_page} onValueChange={(v) => setPrefData({ ...prefData, default_landing_page: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pageOptions.map(page => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.id === 'Dashboard' 
                          ? (prefData.nickname ? `${prefData.nickname}'s Day` : "My Day")
                          : page.name
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Bible Settings Moved Here */}
            <Card className="mb-4">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-base">Enable Bible Features</Label>
                  <Switch 
                    checked={prefData.enable_bible_options !== false}
                    onCheckedChange={(checked) => setPrefData({ ...prefData, enable_bible_options: checked })}
                  />
                </div>

                {(prefData.enable_bible_options !== false) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Preferred Bible Version</Label>
                      <Select value={prefData.bible_version || 'NIV'} onValueChange={(v) => setPrefData({ ...prefData, bible_version: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {bibleVersions.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {prefData.bible_version === 'custom' && (
                        <Input
                          placeholder="Enter your Bible translation name (e.g., 'The Message')"
                          value={prefData.custom_bible_translation || ''}
                          onChange={(e) => setPrefData({ ...prefData, custom_bible_translation: e.target.value })}
                          className="mt-2"
                        />
                      )}
                      <p className="text-xs text-gray-500">Only accurate, approved translations available.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Daily Habits</h4>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>Morning Bible Reading</span>
                          <Switch 
                            checked={prefData.enable_morning_reading !== false}
                            onCheckedChange={(checked) => setPrefData({ ...prefData, enable_morning_reading: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>Night Bible Reading</span>
                          <Switch 
                            checked={prefData.enable_night_reading}
                            onCheckedChange={(checked) => setPrefData({ ...prefData, enable_night_reading: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>Morning Prayer</span>
                          <Switch 
                            checked={prefData.enable_morning_prayer}
                            onCheckedChange={(checked) => setPrefData({ ...prefData, enable_morning_prayer: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>Night Prayer</span>
                          <Switch 
                            checked={prefData.enable_night_prayer}
                            onCheckedChange={(checked) => setPrefData({ ...prefData, enable_night_prayer: checked })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Reading Plans & Audio</h4>
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
                          <p className="text-sm text-indigo-800 mb-3">
                            Follow a structured reading plan on Bible.com (YouVersion) to stay on track.
                          </p>
                          <a 
                            href="https://www.bible.com/reading-plans" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Browse Reading Plans
                          </a>
                        </div>
                        <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                          <p className="text-sm text-purple-800 mb-3">
                            Listen to the Bible being read aloud
                          </p>
                          <a 
                            href="https://www.bible.com/audio-bible" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Listen to Audio Bible
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Custom Homepage Section - Only show if landing page is CustomHomepage */}
            {prefData.default_landing_page === 'CustomHomepage' && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-600" />
                  🎨 Custom Homepage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Helpful Resources */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-2 border-purple-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-600" />
                        Canva Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Export HTML directly from Canva to create beautiful custom pages
                      </p>
                      <a 
                        href="https://www.canva.com/code/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Canva Code
                      </a>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-teal-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        Rhonda's Wins Course
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">
                        Learn to create custom HTML with ChatGPT! Includes base template + help
                      </p>
                      <a 
                        href="https://rhondaswins.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit & Book Time
                      </a>
                    </CardContent>
                  </Card>
                </div>

                {/* Legacy HTML Migration Notice */}
                {prefData.custom_homepage_html && (!prefData.custom_homepages || prefData.custom_homepages.length === 0) && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 mb-3">
                      ✨ You have HTML in the old format. Click below to migrate it to the new system!
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const migratedHomepage = {
                          id: Date.now().toString(),
                          name: 'My Homepage',
                          html: prefData.custom_homepage_html,
                          is_default: true
                        };
                        setPrefData({
                          ...prefData,
                          custom_homepages: [migratedHomepage],
                          active_homepage_id: migratedHomepage.id
                        });
                      }}
                    >
                      Migrate to New Format
                    </Button>
                  </div>
                )}

                {/* List of Custom Homepages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Your Custom Homepages</Label>
                    <Button
                      size="sm"
                      onClick={() => {
                        const newHomepage = {
                          id: Date.now().toString(),
                          name: 'New Homepage',
                          html: '',
                          is_default: (prefData.custom_homepages || []).length === 0
                        };
                        setPrefData({
                          ...prefData,
                          custom_homepages: [...(prefData.custom_homepages || []), newHomepage],
                          active_homepage_id: newHomepage.id
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Homepage
                    </Button>
                  </div>

                  {(prefData.custom_homepages || []).length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 mb-3">No custom homepages yet</p>
                      <Button
                        onClick={() => {
                          const newHomepage = {
                            id: Date.now().toString(),
                            name: 'My First Homepage',
                            html: '',
                            is_default: true
                          };
                          setPrefData({
                            ...prefData,
                            custom_homepages: [newHomepage],
                            active_homepage_id: newHomepage.id
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create Your First Homepage
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prefData.custom_homepages.map((homepage, idx) => (
                        <Card key={homepage.id} className={homepage.id === prefData.active_homepage_id ? 'border-2 border-purple-400 bg-white' : 'bg-white'}>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Input
                                  value={homepage.name}
                                  onChange={(e) => {
                                    const updated = [...prefData.custom_homepages];
                                    updated[idx].name = e.target.value;
                                    setPrefData({ ...prefData, custom_homepages: updated });
                                  }}
                                  placeholder="Homepage name"
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant={homepage.id === prefData.active_homepage_id ? 'default' : 'outline'}
                                  onClick={() => setPrefData({ ...prefData, active_homepage_id: homepage.id })}
                                >
                                  {homepage.id === prefData.active_homepage_id ? '✓ Active' : 'Set Active'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const updated = prefData.custom_homepages.filter(h => h.id !== homepage.id);
                                    setPrefData({ 
                                      ...prefData, 
                                      custom_homepages: updated,
                                      active_homepage_id: updated[0]?.id || null
                                    });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="text-blue-800">
                                    <p className="font-semibold mb-1">What to paste:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                      <li><strong>Canva Code:</strong> Click "Publish" → "Website" → "View code" → Copy ALL</li>
                                      <li><strong>Custom HTML:</strong> Complete HTML with &lt;html&gt;, &lt;head&gt;, &lt;body&gt;</li>
                                    </ul>
                                  </div>
                                </div>
                                <Textarea
                                  placeholder="Paste your HTML code here..."
                                  value={homepage.html}
                                  onChange={(e) => {
                                    const updated = [...prefData.custom_homepages];
                                    updated[idx].html = e.target.value;
                                    setPrefData({ ...prefData, custom_homepages: updated });
                                  }}
                                  className="font-mono text-sm min-h-[200px]"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Pro Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Create different homepages for work, projects, or clients</li>
                      <li>Use Canva Code or get help from Rhonda's Wins course</li>
                      <li>Switch between homepages anytime by clicking "Set Active"</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>











          </Tabs>


          </div>
          </div>
          );
          }