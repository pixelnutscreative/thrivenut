import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, User, Palette, Eye, Layers, MessageSquare, Clock, Share2, Music, Sparkles, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import SpeakButton, { speak } from '../components/accessibility/SpeakButton';
import FeatureOrderManager from '../components/settings/FeatureOrderManager';
import DashboardPreferences from '../components/settings/DashboardPreferences';
import { getEffectiveUserEmail, isImpersonating } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';



const greetingTypes = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!' },
  { id: 'affirmation', name: 'Daily Affirmation', description: 'Personalized affirmations' }
];

const accessibilityModes = [
  { id: 'standard', name: 'Standard', description: 'Default text and contrast' },
  { id: 'high_contrast', name: 'High Contrast', description: 'Enhanced contrast' },
  { id: 'large_text', name: 'Large Text', description: 'Larger font sizes' },
  { id: 'adhd_friendly', name: 'ADHD-Friendly', description: 'Checklists & structure' },
  { id: 'autism_friendly', name: 'Autism-Friendly', description: 'Simplified, sensory-friendly' }
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Get effective email (real user or impersonated)
  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;
  const currentlyImpersonating = isImpersonating();

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const [formData, setFormData] = useState({
    theme_type: 'light',
    primary_color: '#1fd2ea',
    accent_color: '#bd84f5',
    greeting_type: 'positive_quote',
    user_timezone: 'America/New_York',
    enabled_modules: ['tiktok', 'gifter', 'goals', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'],
    feature_order: [],
    profile_image_url: null,
    header_image_url: null,
    background_image_url: null,
    accessibility_mode: 'standard',
    use_text_to_speech: false,
    share_songs_with_pixel: false,
    song_share_email: '',
    tiktok_username: '',
    allow_in_community_directory: false,
    allow_search_by_tiktok_username: false,
    tiktok_display_name: '',
    room_vibe: '',
    default_song_tone: 'upbeat',
    include_levelup_verse: true,
    league_level: '',
    gender: '',
    completed_tasks_display: 'show_checked',
    enable_water_reminders: true,
    enable_mood_checkins: true,
    intermittent_fasting: false,
    fasting_schedule: '16_8',
    eating_window_start: '12:00',
    eating_window_end: '20:00'
    });

  useEffect(() => {
    if (preferences) {
      setFormData({
        theme_type: preferences.theme_type || 'light',
        primary_color: preferences.primary_color || '#1fd2ea',
        accent_color: preferences.accent_color || '#bd84f5',
        greeting_type: preferences.greeting_type || 'positive_quote',
        user_timezone: preferences.user_timezone || 'America/New_York',
        enabled_modules: preferences.enabled_modules || ['tiktok', 'gifter', 'goals', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'],
        feature_order: preferences.feature_order || [],
        profile_image_url: preferences.profile_image_url || null,
        header_image_url: preferences.header_image_url || null,
        background_image_url: preferences.background_image_url || null,
        accessibility_mode: preferences.accessibility_mode || 'standard',
        use_text_to_speech: preferences.use_text_to_speech || false,
        share_songs_with_pixel: preferences.share_songs_with_pixel || false,
        song_share_email: preferences.song_share_email || '',
        tiktok_username: preferences.tiktok_username || '',
        allow_in_community_directory: preferences.allow_in_community_directory || false,
        allow_search_by_tiktok_username: preferences.allow_search_by_tiktok_username || false,
        tiktok_display_name: preferences.tiktok_display_name || '',
        room_vibe: preferences.room_vibe || '',
        default_song_tone: preferences.default_song_tone || 'upbeat',
        include_levelup_verse: preferences.include_levelup_verse !== false,
        league_level: preferences.league_level || '',
        gender: preferences.gender || '',
        completed_tasks_display: preferences.completed_tasks_display || 'show_checked',
        enable_water_reminders: preferences.enable_water_reminders !== false,
        enable_mood_checkins: preferences.enable_mood_checkins !== false,
        intermittent_fasting: preferences.intermittent_fasting || false,
        fasting_schedule: preferences.fasting_schedule || '16_8',
        eating_window_start: preferences.eating_window_start || '12:00',
        eating_window_end: preferences.eating_window_end || '20:00'
        });
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      // Get the most recent preferences record for effective user
      const allPrefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      const currentPref = allPrefs[0];
      
      if (currentPref) {
        return await base44.entities.UserPreferences.update(currentPref.id, data);
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
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    },
  });

  

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const { isDark, bgClass } = useTheme();

  if (loading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium"
            >
              ✓ {saveMessage}
            </motion.div>
          )}
          <Button
            onClick={handleSave}
            disabled={updatePreferencesMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {updatePreferencesMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Features</span>
              </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
              </TabsList>

          {/* Profile Tab - now includes TikTok info */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile
                  </CardTitle>
                  <CardDescription>Your profile picture and personal info</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ImageUploader
                    label="Profile Picture"
                    currentImage={formData.profile_image_url}
                    onImageChange={(url) => setFormData({ ...formData, profile_image_url: url })}
                    aspectRatio="square"
                  />
                </CardContent>
              </Card>

              {/* TikTok Profile Info */}
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-purple-500" />
                    TikTok Profile
                  </CardTitle>
                  <CardDescription>Your TikTok info for songs and sharing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>TikTok Username</Label>
                      <Input
                        placeholder="@username"
                        value={formData.tiktok_username}
                        onChange={(e) => setFormData({ ...formData, tiktok_username: e.target.value.replace('@', '') })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Name (for songs)</Label>
                      <Input
                        placeholder="e.g., Pixel, Queen Sarah"
                        value={formData.tiktok_display_name}
                        onChange={(e) => setFormData({ ...formData, tiktok_display_name: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">How Sunny Songbird will call you</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>League Level</Label>
                      <Select value={formData.league_level} onValueChange={(v) => setFormData({ ...formData, league_level: v })}>
                        <SelectTrigger><SelectValue placeholder="Select league" /></SelectTrigger>
                        <SelectContent>
                          {['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4', 'D5'].map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Song Tone</Label>
                      <Select value={formData.default_song_tone} onValueChange={(v) => setFormData({ ...formData, default_song_tone: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upbeat">🎉 Upbeat</SelectItem>
                          <SelectItem value="chill">😌 Chill</SelectItem>
                          <SelectItem value="hype">🔥 Hype</SelectItem>
                          <SelectItem value="emotional">💜 Emotional</SelectItem>
                          <SelectItem value="funny">😂 Funny</SelectItem>
                          <SelectItem value="epic">⚡ Epic</SelectItem>
                          <SelectItem value="cozy">☕ Cozy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Room Vibe / Theme</Label>
                    <Textarea
                      placeholder="e.g., Beach party vibes, chill zone, neon club energy..."
                      value={formData.room_vibe}
                      onChange={(e) => setFormData({ ...formData, room_vibe: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, include_levelup_verse: !formData.include_levelup_verse })}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.include_levelup_verse ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={formData.include_levelup_verse} />
                      <div>
                        <h4 className="font-semibold text-sm">Include Level-Up Verse in Songs</h4>
                        <p className="text-xs text-gray-600">Add encouragement to level up!</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Sharing</CardTitle>
                  <CardDescription>Control how others can find you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onClick={() => setFormData({ ...formData, allow_in_community_directory: !formData.allow_in_community_directory })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.allow_in_community_directory ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={formData.allow_in_community_directory} />
                      <div>
                        <h4 className="font-semibold">Show in Community Directory</h4>
                        <p className="text-sm text-gray-600">Let your live schedule appear for other ThriveNut users</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, allow_search_by_tiktok_username: !formData.allow_search_by_tiktok_username })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.allow_search_by_tiktok_username ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={formData.allow_search_by_tiktok_username} />
                      <div>
                        <h4 className="font-semibold">Allow search by TikTok username</h4>
                        <p className="text-sm text-gray-600">Let others find you by searching your TikTok username</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab - now includes background image */}
          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Theme & Colors
                  </CardTitle>
                  <CardDescription>Choose your theme and colors</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeSelector
                    themeData={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                  />
                </CardContent>
              </Card>


            </motion.div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="modules">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Features
                  </CardTitle>
                  <CardDescription>Enable features and drag to reorder them in the menu</CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureOrderManager
                    enabledModules={formData.enabled_modules}
                    featureOrder={formData.feature_order}
                    onChange={(updates) => setFormData({ ...formData, ...updates })}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Preferences Tab - now includes accessibility in collapsible */}
          <TabsContent value="preferences">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timezone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TimezoneSelector
                    value={formData.user_timezone}
                    onChange={(val) => setFormData({ ...formData, user_timezone: val })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Daily Greeting
                  </CardTitle>
                  <CardDescription>How should we greet you each day?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {greetingTypes.map(greeting => (
                    <div
                      key={greeting.id}
                      onClick={() => setFormData({ ...formData, greeting_type: greeting.id })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.greeting_type === greeting.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.greeting_type === greeting.id
                            ? 'border-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.greeting_type === greeting.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{greeting.name}</h4>
                          <p className="text-sm text-gray-600">{greeting.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Accessibility - Collapsible */}
              <Collapsible>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          <CardTitle>Accessibility Options</CardTitle>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </div>
                      <CardDescription className="text-left">Visual modes and text-to-speech</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                      <div className="space-y-3">
                        <h4 className="font-semibold">Visual Mode</h4>
                        {accessibilityModes.map(mode => (
                          <div
                            key={mode.id}
                            onClick={() => setFormData({ ...formData, accessibility_mode: mode.id })}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.accessibility_mode === mode.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.accessibility_mode === mode.id ? 'border-purple-500' : 'border-gray-300'
                              }`}>
                                {formData.accessibility_mode === mode.id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold">{mode.name}</h4>
                                <p className="text-sm text-gray-600">{mode.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <div
                          onClick={() => setFormData({ ...formData, use_text_to_speech: !formData.use_text_to_speech })}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.use_text_to_speech
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox checked={formData.use_text_to_speech} />
                            <div>
                              <h4 className="font-semibold">Enable Text-to-Speech</h4>
                              <p className="text-sm text-gray-600">Hear options read aloud (works on this page only for now)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DashboardPreferences formData={formData} setFormData={setFormData} />
            </motion.div>
          </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}