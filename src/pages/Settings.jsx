import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, User, Palette, Layers, MessageSquare, Zap, BookOpen, Shirt, Gift, Share2, Sparkles, Plus, Trash2, Briefcase, Check, Code, ExternalLink, UserX, Calendar as CalendarIcon, Sliders, PuzzleIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ColorPicker from '../components/shared/ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import ReferralsTab from '../components/settings/ReferralsTab';
import AccountDeletionTab from '../components/settings/AccountDeletionTab';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import People from './People';
import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';
import ProfileFavoritesTab from '../components/contacts/ProfileFavoritesTab';
import MomentsTabContent from '../components/contacts/MomentsTabContent';

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
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedTabs, setExpandedTabs] = useState(['profile']);

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

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', effectiveEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: effectiveEmail });
      return profiles[0] || null;
    },
    enabled: !!effectiveEmail,
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
    started_going_live: ''
  });

  useEffect(() => {
    if (preferences) {
      setPrefData(preferences.data || preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        ...userProfile,
        clothing_sizes: userProfile.clothing_sizes || {},
        beauty_profile: userProfile.beauty_profile || {},
        style_profile: userProfile.style_profile || {},
        social_links: userProfile.social_links || {},
        privacy_settings: {
          share_sizes: true,
          share_wishlist: true,
          share_socials: true,
          share_recovery: true,
          share_military: true,
          share_color: true,
          ...userProfile.privacy_settings
        },
        phonetic: userProfile.phonetic || '',
        role: userProfile.role || [],
        creator_notes: userProfile.creator_notes || '',
        calendar_enabled: userProfile.calendar_enabled || false,
        is_gifter: userProfile.is_gifter || false,
        live_stream_types: userProfile.live_stream_types || [],
        live_agency: userProfile.live_agency || '',
        shop_agency: userProfile.shop_agency || '',
        started_going_live: userProfile.started_going_live || ''
      });
    }
  }, [userProfile]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return await base44.entities.UserPreferences.create({
          user_email: effectiveEmail,
          ...data,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    },
  });

  const updateUserProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (userProfile) {
        return await base44.entities.UserProfile.update(userProfile.id, data);
      } else {
        return await base44.entities.UserProfile.create({
          user_email: effectiveEmail,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', effectiveEmail] });
      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    },
    onError: (error) => {
      console.error('Save error:', error);
      setSaveMessage('Error saving!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const handleSave = async () => {
    const promises = [];
    
    if (Object.keys(prefData).length > 0 && preferences) {
      promises.push(updatePreferencesMutation.mutateAsync(prefData));
    }
    
    if (profileData && (profileData.social_links || profileData.clothing_sizes || profileData.wish_list)) {
      promises.push(updateUserProfileMutation.mutateAsync(profileData));
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
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
    <div className={`min-h-screen ${bgClass} p-4 md:p-8 pb-32`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <div className="flex items-center gap-2">
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                {saveMessage}
              </motion.div>
            )}

          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { 
          handleSave(); 
          setActiveTab(v); 
          navigate(`#${v}`); 
        }} className="w-full">
          <TabsList className="grid grid-cols-6 md:grid-cols-10 gap-1 mb-6 bg-transparent h-auto">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <User className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger value="appearance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Palette className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Layers className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <CalendarIcon className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Sliders className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="widgets-v2" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <PuzzleIcon className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger value="bible" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Share2 className="w-4 h-4" />
            </TabsTrigger>

          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending || updateUserProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updatePreferencesMutation.isPending || updateUserProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                    {/* Creator Profile Section with Tabs */}
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4" /> My Profile Card</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Share Creator Info</span>
                          <Switch 
                            checked={profileData.privacy_settings?.share_creator_info}
                            onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_creator_info', checked)}
                          />
                        </div>
                      </div>

                      <Card className="border-2 border-purple-100 bg-white overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 bg-gray-50/50">
                            <ContactFormHeader 
                              formData={{
                                ...profileData,
                                real_name: user?.full_name,
                                image_url: prefData.profile_image_url,
                                color: profileData.favorite_color,
                                clubs: profileData.clubs,
                                custom_clubs: profileData.custom_clubs
                              }} 
                              setFormData={(newData) => {
                                setProfileData(prev => ({
                                  ...prev,
                                  nickname: newData.nickname,
                                  favorite_color: newData.color,
                                  clubs: newData.clubs,
                                  custom_clubs: newData.custom_clubs
                                }));
                                if (newData.image_url !== prefData.profile_image_url) {
                                  setPrefData(prev => ({ ...prev, profile_image_url: newData.image_url }));
                                }
                              }}
                              onSave={() => handleSave()}
                              isSaving={updatePreferencesMutation.isPending || updateUserProfileMutation.isPending}
                              isEditing={true}
                              showIrlToggle={false}
                              isProfile={true}
                              primaryColor={primaryColor}
                            />
                          </div>

                          <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="w-full grid grid-cols-5 rounded-none border-b bg-gray-50/50 p-0 h-12">
                              <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white h-full text-xs px-1">
                                Personal
                              </TabsTrigger>
                              <TabsTrigger value="favorites" className="rounded-none border-b-2 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-white h-full text-xs px-1">
                                Favorites
                              </TabsTrigger>
                              <TabsTrigger value="moments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white h-full text-xs px-1">
                                Moments
                              </TabsTrigger>
                              <TabsTrigger value="tiktok" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-white h-full text-xs px-1">
                                TikTok
                              </TabsTrigger>
                              <TabsTrigger value="business" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-white h-full text-xs px-1">
                                Business
                              </TabsTrigger>
                            </TabsList>

                            <div className="p-4">
                              <TabsContent value="personal" className="mt-0 space-y-4">
                                <PersonalTabContent
                                  formData={{
                                    ...profileData,
                                    email: user?.email,
                                    phone: profileData.phone
                                  }}
                                  setFormData={(newData) => setProfileData(prev => ({ ...prev, ...newData }))}
                                  isProfile={true}
                                />
                                <Card>
                                  <CardContent className="pt-6 flex items-center justify-between">
                                    <div>
                                      <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> Work Schedule</h3>
                                      <p className="text-sm text-gray-500">Manage your shifts and work hours</p>
                                    </div>
                                    <Button variant="outline" onClick={() => window.location.href = '/WorkSchedules'}>
                                      Manage Schedule
                                    </Button>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              <TabsContent value="favorites" className="mt-0">
                                <ProfileFavoritesTab
                                  formData={profileData}
                                  setFormData={setProfileData}
                                  isProfile={true}
                                />
                              </TabsContent>

                              <TabsContent value="moments" className="mt-0">
                                <div className="p-4 bg-white">
                                  <MomentsTabContent
                                    formData={profileData}
                                    setFormData={setProfileData}
                                    isProfile={true}
                                  />
                                </div>
                              </TabsContent>

                              <TabsContent value="tiktok" className="mt-0">
                                <TikTokTabContent
                                  formData={{
                                    ...profileData,
                                    username: prefData.tiktok_username,
                                    display_name: profileData.display_name,
                                  }}
                                  setFormData={(newData) => {
                                    setProfileData(prev => ({ ...prev, ...newData }));
                                    if (newData.username !== prefData.tiktok_username) {
                                      setPrefData(prev => ({ ...prev, tiktok_username: newData.username }));
                                    }
                                  }}
                                  contacts={[]}
                                  categories={[]}
                                  isProfile={true}
                                />
                              </TabsContent>

                              <TabsContent value="business" className="mt-0">
                                <BusinessTabContent
                                  formData={profileData}
                                  setFormData={(newData) => setProfileData(prev => ({ ...prev, ...newData }))}
                                  isProfile={true}
                                />
                              </TabsContent>
                            </div>
                          </Tabs>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Delete Account Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <AccountDeletionTab userEmail={effectiveEmail} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* APPEARANCE TAB */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Theme & Colors</CardTitle>
                  <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updatePreferencesMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent><ThemeSelector themeData={prefData} onChange={(data) => setPrefData({ ...prefData, ...data })} /></CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES TAB */}
          <TabsContent value="features">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Features</CardTitle>
                  <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updatePreferencesMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent><FeatureOrderManager enabledModules={prefData.enabled_modules} onChange={(updates) => setPrefData({ ...prefData, ...updates })} /></CardContent>
            </Card>
          </TabsContent>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Daily Greeting Types</CardTitle>
                <CardDescription>Select which types of daily messages you want to see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {greetingTypeOptions.map(greeting => {
                  const isSelected = prefData.greeting_types?.includes(greeting.id);
                  return (
                    <div
                      key={greeting.id}
                      onClick={() => {
                        const current = prefData.greeting_types || [];
                        const newTypes = isSelected
                          ? current.filter(t => t !== greeting.id)
                          : [...current, greeting.id];
                        if (newTypes.length > 0) {
                          setPrefData({ ...prefData, greeting_types: newTypes, greeting_type: newTypes[0] });
                        }
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <span>{greeting.icon}</span>
                        <span className="font-medium">{greeting.name}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <DashboardPreferences formData={prefData} setFormData={setPrefData} />
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <Card className="mb-4">
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

          {/* CONNECTIONS TAB */}
          <TabsContent value="connections" id="connections">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>AI Platform Connection</CardTitle>
                <CardDescription>Select which AI platform you're subscribed to for personalized tool links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!prefData.ai_platform && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium mb-3">
                      🎨 You don't have AI tools selected yet! Choose a platform below to get started.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Choose Your AI Platform</Label>
                    <p className="text-sm text-gray-500 mt-1 mb-3">This determines which tool links you'll see when creating content</p>
                    <Select 
                      value={prefData.ai_platform || ''} 
                      onValueChange={(v) => {
                        setPrefData({ ...prefData, ai_platform: v });
                        updatePreferencesMutation.mutate({ ai_platform: v });
                      }}
                    >
                      <SelectTrigger className="max-w-sm">
                        <SelectValue placeholder="Select your platform..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lets_go_nuts">Let's Go Nuts</SelectItem>
                        <SelectItem value="pixels_toolbox">Pixel's AI Toolbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      ℹ️ Can't remember which one you're subscribed to? No problem! Just pick one and you can change it anytime.
                    </p>
                  </div>

                  {/* Quick links */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Links</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href="https://ai.thenutsandbots.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center"
                      >
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <p className="font-medium text-sm">Pixel's AI Toolbox</p>
                      </a>
                      <a 
                        href="https://create.letsgonuts.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors text-center"
                      >
                        <Zap className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                        <p className="font-medium text-sm">Let's Go Nuts</p>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WIDGETS V2 TAB */}
          <TabsContent value="widgets-v2" id="widgets-v2">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <WidgetSettingsV2 formData={prefData} setFormData={setPrefData} />
          </TabsContent>

          {/* BIBLE TAB */}
          <TabsContent value="bible">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <Card>
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
          </TabsContent>

          {/* REFERRALS TAB */}
          <TabsContent value="referrals">
            <ReferralsTab 
              userEmail={effectiveEmail} 
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </TabsContent>



          </Tabs>


          </div>
          </div>
          );
          }