import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, User, Palette, Eye, Layers, MessageSquare, Clock, Share2, Music, Sparkles, ChevronDown, ChevronRight, MessageCircle, Plus, Trash2, Users, LayoutDashboard, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import SpeakButton, { speak } from '../components/accessibility/SpeakButton';
import FeatureOrderManager from '../components/settings/FeatureOrderManager';
import DashboardPreferences from '../components/settings/DashboardPreferences';
import QuickActionsSettings from '../components/settings/QuickActionsSettings';
import SoundCloudSettings from '../components/settings/SoundCloudSettings';
import { getEffectiveUserEmail, isImpersonating } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';



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
  { id: 'PixelsParadise', name: "Pixel's Place" },
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
  const [expandedSections, setExpandedSections] = useState(['profile']);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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
    greeting_types: ['positive_quote'],
    default_landing_page: 'Dashboard',
    ai_tool_links: [],
    motivation_categories: ['Content Ideas', 'Personal Growth', 'Spiritual', 'Business'],
    user_timezone: 'America/New_York',
    enabled_modules: ['tiktok', 'gifter', 'goals', 'tasks', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'],
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
    eating_window_end: '20:00',
    google_calendar_connected: false,
    show_google_calendar: false,
    discord_username: '',
    discord_invite_link: '',
    discord_public: false,
    communities: [],
    menu_color: '#ffffff',
    quick_actions: ['mood', 'water', 'food', 'note'],
    quick_actions_position: 'bottom',
    custom_quick_actions: [],
    soundcloud_playlist_url: '',
    soundcloud_player_position: 'hidden'
    });

  useEffect(() => {
    if (preferences) {
      setFormData({
        theme_type: preferences.theme_type || 'light',
        primary_color: preferences.primary_color || '#1fd2ea',
        accent_color: preferences.accent_color || '#bd84f5',
        greeting_type: preferences.greeting_type || 'positive_quote',
      greeting_types: preferences.greeting_types || [preferences.greeting_type || 'positive_quote'],
      default_landing_page: preferences.default_landing_page || 'Dashboard',
      ai_tool_links: preferences.ai_tool_links || [],
      motivation_categories: preferences.motivation_categories || ['Content Ideas', 'Personal Growth', 'Spiritual', 'Business'],
        user_timezone: preferences.user_timezone || 'America/New_York',
        enabled_modules: preferences.enabled_modules || ['tiktok', 'gifter', 'goals', 'tasks', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'],
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
        eating_window_end: preferences.eating_window_end || '20:00',
        google_calendar_connected: preferences.google_calendar_connected || false,
        show_google_calendar: preferences.show_google_calendar || false,
        discord_username: preferences.discord_username || '',
        discord_invite_link: preferences.discord_invite_link || '',
        discord_public: preferences.discord_public || false,
        communities: preferences.communities || [],
        menu_color: preferences.menu_color || '#ffffff',
        quick_actions: preferences.quick_actions || ['mood', 'water', 'food', 'note'],
        quick_actions_position: preferences.quick_actions_position || 'bottom',
        custom_quick_actions: preferences.custom_quick_actions || [],
        soundcloud_playlist_url: preferences.soundcloud_playlist_url || '',
        soundcloud_player_position: preferences.soundcloud_player_position || 'hidden'
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

        <div className="space-y-4">
          {/* ========== PROFILE SECTION ========== */}
          <Collapsible open={expandedSections.includes('profile')} onOpenChange={() => toggleSection('profile')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('profile') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Profile & Social</CardTitle>
                      <CardDescription>Your profile, TikTok info, and communities</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('profile') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile
                  </CardTitle>
                  <CardDescription>Your profile picture and personal info</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    {/* Small profile pic on left */}
                    <div className="flex-shrink-0">
                      <ImageUploader
                        label=""
                        currentImage={formData.profile_image_url}
                        onImageChange={(url) => setFormData({ ...formData, profile_image_url: url })}
                        aspectRatio="square"
                        size="small"
                      />
                    </div>
                    {/* Two columns of info on right */}
                    <div className="flex-1 grid md:grid-cols-2 gap-4">
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
                  </div>
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

              {/* Discord & Community */}
              <Card className="border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                    Discord & Communities
                  </CardTitle>
                  <CardDescription>Share your Discord and other community links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discord Username</Label>
                      <Input
                        placeholder="username#1234 or just username"
                        value={formData.discord_username}
                        onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discord Invite Link</Label>
                      <Input
                        placeholder="https://discord.gg/..."
                        value={formData.discord_invite_link}
                        onChange={(e) => setFormData({ ...formData, discord_invite_link: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, discord_public: !formData.discord_public })}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.discord_public ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={formData.discord_public} />
                      <div>
                        <h4 className="font-semibold text-sm">Show Discord in Discover Creators</h4>
                        <p className="text-xs text-gray-600">Let others see your Discord link</p>
                      </div>
                    </div>
                  </div>

                  {/* Other Communities */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Other Communities
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ 
                          ...formData, 
                          communities: [...formData.communities, { platform: 'skool', name: '', link: '', is_free: true, is_paid: false, is_public: false }]
                        })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {formData.communities.map((community, idx) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-3 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Select 
                            value={community.platform} 
                            onValueChange={(v) => {
                              const updated = [...formData.communities];
                              updated[idx] = { ...updated[idx], platform: v };
                              setFormData({ ...formData, communities: updated });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skool">Skool</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="base44">Base44 App</SelectItem>
                              <SelectItem value="patreon">Patreon</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Community name"
                            value={community.name}
                            onChange={(e) => {
                              const updated = [...formData.communities];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setFormData({ ...formData, communities: updated });
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = formData.communities.filter((_, i) => i !== idx);
                              setFormData({ ...formData, communities: updated });
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Link (https://...)"
                          value={community.link}
                          onChange={(e) => {
                            const updated = [...formData.communities];
                            updated[idx] = { ...updated[idx], link: e.target.value };
                            setFormData({ ...formData, communities: updated });
                          }}
                        />
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={community.is_free}
                              onCheckedChange={(checked) => {
                                const updated = [...formData.communities];
                                updated[idx] = { ...updated[idx], is_free: checked };
                                setFormData({ ...formData, communities: updated });
                              }}
                            />
                            <span className="text-sm">Free</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={community.is_paid}
                              onCheckedChange={(checked) => {
                                const updated = [...formData.communities];
                                updated[idx] = { ...updated[idx], is_paid: checked };
                                setFormData({ ...formData, communities: updated });
                              }}
                            />
                            <span className="text-sm">Paid</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={community.is_public}
                              onCheckedChange={(checked) => {
                                const updated = [...formData.communities];
                                updated[idx] = { ...updated[idx], is_public: checked };
                                setFormData({ ...formData, communities: updated });
                              }}
                            />
                            <span className="text-sm">Show in Directory</span>
                          </label>
                        </div>
                      </div>
                    ))}
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
          </CollapsibleContent>
        </Collapsible>

        {/* ========== APPEARANCE SECTION ========== */}
        <Collapsible open={expandedSections.includes('appearance')} onOpenChange={() => toggleSection('appearance')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('appearance') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Theme & Appearance</CardTitle>
                    <CardDescription>Colors, dark mode, and visual style</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('appearance') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ThemeSelector
                    themeData={formData}
                    onChange={(data) => setFormData({ ...formData, ...data })}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== FEATURES SECTION ========== */}
        <Collapsible open={expandedSections.includes('features')} onOpenChange={() => toggleSection('features')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('features') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Features</CardTitle>
                    <CardDescription>Show or hide features in your menu</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('features') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <FeatureOrderManager
                    enabledModules={formData.enabled_modules}
                    onChange={(updates) => setFormData({ ...formData, ...updates })}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== DASHBOARD SECTION ========== */}
        <Collapsible open={expandedSections.includes('dashboard')} onOpenChange={() => toggleSection('dashboard')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('dashboard') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Dashboard</CardTitle>
                    <CardDescription>My Day view, task display, and reminders</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('dashboard') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <DashboardPreferences formData={formData} setFormData={setFormData} />
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== PREFERENCES SECTION ========== */}
        <Collapsible open={expandedSections.includes('preferences')} onOpenChange={() => toggleSection('preferences')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('preferences') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Preferences</CardTitle>
                    <CardDescription>Timezone, greetings, and landing page</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('preferences') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
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
                  <CardTitle className="text-base">Daily Greeting Types</CardTitle>
                  <CardDescription>Select multiple to rotate through</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {greetingTypeOptions.map(greeting => {
                    const isSelected = formData.greeting_types?.includes(greeting.id);
                    return (
                      <div
                        key={greeting.id}
                        onClick={() => {
                          const current = formData.greeting_types || [];
                          const newTypes = isSelected
                            ? current.filter(t => t !== greeting.id)
                            : [...current, greeting.id];
                          if (newTypes.length > 0) {
                            setFormData({ ...formData, greeting_types: newTypes, greeting_type: newTypes[0] });
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Default Landing Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.default_landing_page}
                    onValueChange={(v) => setFormData({ ...formData, default_landing_page: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageOptions.map(page => (
                        <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== WIDGETS SECTION ========== */}
        <Collapsible open={expandedSections.includes('widgets')} onOpenChange={() => toggleSection('widgets')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('widgets') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Widgets</CardTitle>
                    <CardDescription>Quick actions and SoundCloud player</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('widgets') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-4">
              <QuickActionsSettings formData={formData} setFormData={setFormData} />
              <SoundCloudSettings formData={formData} setFormData={setFormData} />
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* ========== ACCESSIBILITY SECTION ========== */}
        <Collapsible open={expandedSections.includes('accessibility')} onOpenChange={() => toggleSection('accessibility')}>
          <CollapsibleTrigger className="w-full">
            <Card className={`cursor-pointer transition-all ${expandedSections.includes('accessibility') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg">Accessibility</CardTitle>
                    <CardDescription>Visual modes and text-to-speech</CardDescription>
                  </div>
                </div>
                {expandedSections.includes('accessibility') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label className="font-semibold">Visual Mode</Label>
                    {accessibilityModes.map(mode => (
                      <div
                        key={mode.id}
                        onClick={() => setFormData({ ...formData, accessibility_mode: mode.id })}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.accessibility_mode === mode.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.accessibility_mode === mode.id ? 'border-purple-500' : 'border-gray-300'
                          }`}>
                            {formData.accessibility_mode === mode.id && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{mode.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{mode.description}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div
                      onClick={() => setFormData({ ...formData, use_text_to_speech: !formData.use_text_to_speech })}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.use_text_to_speech
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.use_text_to_speech} />
                        <div>
                          <span className="font-medium">Enable Text-to-Speech</span>
                          <p className="text-sm text-gray-500">Hear options read aloud</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
        </div>
      </div>
    </div>
  );
}