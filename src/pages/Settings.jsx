import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, BookOpen, Lock, Palette, Layout, Sparkles, Heart, Activity, Share2, Trash2 } from 'lucide-react';

import DashboardPreferences from '@/components/settings/DashboardPreferences';
import AIPersonalitySettings from '@/components/settings/AIPersonalitySettings';
import AddressingPreferences from '@/components/settings/AddressingPreferences';
import MentalHealthSettings from '@/components/settings/MentalHealthSettings';
import MoodEmojiSettings from '@/components/settings/MoodEmojiSettings';
import WidgetSettingsV2 from '@/components/settings/WidgetSettingsV2';
import SoundCloudSettings from '@/components/settings/SoundCloudSettings';
import FeatureOrderManager from '@/components/settings/FeatureOrderManager';
import ImageUploader from '@/components/settings/ImageUploader';
import ReferralsTab from '@/components/settings/ReferralsTab';
import AccountDeletionTab from '@/components/settings/AccountDeletionTab';
import ColorPicker from '@/components/shared/ColorPicker';
import TimezoneSelector from '@/components/shared/TimezoneSelector';

export default function Settings() {
  const queryClient = useQueryClient();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // State for UserPreferences
  const [preferences, setPreferences] = useState({});
  // State for MentalHealthProfile (for gating)
  const [mhProfile, setMHProfile] = useState({});

  // 1. Get User
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) setCurrentUserEmail(user.email);
    });
  }, []);

  // 2. Fetch Preferences
  const { data: fetchedPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['userPreferences', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: currentUserEmail });
      return prefs[0] || null;
    },
    enabled: !!currentUserEmail,
    onSuccess: (data) => {
      if (data) setPreferences(data);
      else {
        // Defaults
        setPreferences({
          user_email: currentUserEmail,
          primary_color: '#1fd2ea',
          accent_color: '#bd84f5',
          menu_color: '#2a2a30',
          enable_bible_options: true,
          google_calendar_connected: false,
          user_timezone: 'UTC',
          enabled_modules: ['tasks', 'goals', 'journal', 'wellness'] // truncated defaults
        });
      }
    }
  });

  // 3. Fetch Mental Health Profile (for gating)
  const { data: fetchedMHProfile } = useQuery({
    queryKey: ['mhProfile', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return null;
      const profiles = await base44.entities.MentalHealthProfile.filter({ user_email: currentUserEmail });
      return profiles[0] || {};
    },
    enabled: !!currentUserEmail,
    onSuccess: (data) => {
      if (data) setMHProfile(data);
    }
  });

  // 4. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      try {
        // Save Preferences
        if (fetchedPrefs?.id) {
          await base44.entities.UserPreferences.update(fetchedPrefs.id, preferences);
        } else {
          await base44.entities.UserPreferences.create({ ...preferences, user_email: currentUserEmail });
        }

        // Save Mental Health Profile (if changed)
        if (fetchedMHProfile?.id) {
          await base44.entities.MentalHealthProfile.update(fetchedMHProfile.id, mhProfile);
        } else if (mhProfile.require_medication_before_features !== undefined) { // Only create if we have data
          await base44.entities.MentalHealthProfile.create({ ...mhProfile, user_email: currentUserEmail });
        }

        toast.success("Settings saved successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to save settings.");
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userPreferences', currentUserEmail]);
      queryClient.invalidateQueries(['mhProfile', currentUserEmail]);
      queryClient.invalidateQueries(['preferences']); // for layout
    }
  });

  if (prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your app experience, preferences, and account</p>
          </div>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={isSaving}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-white border shadow-sm rounded-xl gap-1">
            <TabsTrigger value="general" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg py-2">
              <Layout className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-600 rounded-lg py-2">
              <Palette className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600 rounded-lg py-2">
              <Activity className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="wellness" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600 rounded-lg py-2">
              <Heart className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Wellness</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600 rounded-lg py-2">
              <Sparkles className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-600 rounded-lg py-2">
              <Share2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-600 rounded-lg py-2">
              <Trash2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* === GENERAL TAB === */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile & Basics</CardTitle>
                <CardDescription>Your core information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <ImageUploader 
                      label="Profile Picture" 
                      currentImage={preferences.profile_image_url} 
                      onImageChange={(url) => setPreferences({...preferences, profile_image_url: url})}
                      aspectRatio="square"
                      size="small"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label>Nickname</Label>
                      <Input 
                        value={preferences.nickname || ''} 
                        onChange={(e) => setPreferences({...preferences, nickname: e.target.value})} 
                        placeholder="What should we call you?"
                      />
                    </div>
                    <TimezoneSelector 
                      label="Timezone"
                      value={preferences.user_timezone} 
                      onChange={(val) => setPreferences({...preferences, user_timezone: val})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <AddressingPreferences formData={preferences} setFormData={setPreferences} />
            <AIPersonalitySettings formData={preferences} setFormData={setPreferences} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Bible Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Bible & Faith Features</Label>
                    <p className="text-sm text-gray-500">Show daily scripture, prayer requests, and faith-based content</p>
                  </div>
                  <Switch 
                    checked={preferences.enable_bible_options !== false} // Default true
                    onCheckedChange={(checked) => setPreferences({...preferences, enable_bible_options: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === APPEARANCE TAB === */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Colors</CardTitle>
                <CardDescription>Customize the look of your app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">Primary Color</Label>
                    <ColorPicker 
                      color={preferences.primary_color || '#1fd2ea'} 
                      onChange={(c) => setPreferences({...preferences, primary_color: c})} 
                      label="Brand / Main Color"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Accent Color (Buttons & Highlights)</Label>
                    <ColorPicker 
                      color={preferences.accent_color || '#bd84f5'} 
                      onChange={(c) => setPreferences({...preferences, accent_color: c})} 
                      label="Highlights & Accents"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Menu Background Color</Label>
                    <ColorPicker 
                      color={preferences.menu_color || '#2a2a30'} 
                      onChange={(c) => setPreferences({...preferences, menu_color: c})} 
                      label="Sidebar / Mobile Menu Background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <WidgetSettingsV2 formData={preferences} setFormData={setPreferences} />
            <SoundCloudSettings formData={preferences} setFormData={setPreferences} />
          </TabsContent>

          {/* === DASHBOARD TAB === */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardPreferences formData={preferences} setFormData={setPreferences} />
          </TabsContent>

          {/* === WELLNESS TAB === */}
          <TabsContent value="wellness" className="space-y-6">
            <MentalHealthSettings formData={preferences} setFormData={setPreferences} />
            <MoodEmojiSettings formData={preferences} setFormData={setPreferences} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-500" />
                  Self-Care Gating
                </CardTitle>
                <CardDescription>Require medication/supplement check-ins before accessing fun features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-rose-50 border-rose-100">
                  <div className="space-y-0.5">
                    <Label className="text-base text-rose-900">Enable Feature Gating</Label>
                    <p className="text-sm text-rose-700">Block TikTok/Social/Games until you've logged your meds</p>
                  </div>
                  <Switch 
                    checked={mhProfile.require_medication_before_features || false}
                    onCheckedChange={(checked) => setMHProfile({...mhProfile, require_medication_before_features: checked})}
                  />
                </div>
                
                {mhProfile.require_medication_before_features && (
                  <div className="pt-2">
                    <Label className="mb-2 block">Restricted Features</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['tiktok', 'social', 'goals', 'journal'].map(feature => (
                        <div key={feature} className="flex items-center gap-2">
                          <Switch 
                            checked={(mhProfile.restricted_features || []).includes(feature)}
                            onCheckedChange={(checked) => {
                              const current = mhProfile.restricted_features || [];
                              const updated = checked 
                                ? [...current, feature] 
                                : current.filter(f => f !== feature);
                              setMHProfile({...mhProfile, restricted_features: updated});
                            }}
                          />
                          <span className="capitalize">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === MODULES TAB === */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Enable/Disable Features</CardTitle>
                <CardDescription>Clean up your menu by hiding tools you don't use</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureOrderManager 
                  enabledModules={preferences.enabled_modules} 
                  onChange={(updates) => setPreferences({...preferences, ...updates})} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* === REFERRALS TAB === */}
          <TabsContent value="referrals">
            <ReferralsTab 
              userEmail={currentUserEmail} 
              primaryColor={preferences.primary_color} 
              accentColor={preferences.accent_color} 
            />
          </TabsContent>

          {/* === ACCOUNT TAB === */}
          <TabsContent value="account">
            <AccountDeletionTab userEmail={currentUserEmail} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}