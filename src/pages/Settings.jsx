import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, User, Palette, Eye, Layers, MessageSquare, Clock, Share2, Music, Sparkles, ChevronDown, ChevronRight, MessageCircle, Plus, Trash2, Users, LayoutDashboard, Zap, BookOpen, Shirt, Gift, Heart, MapPin, Flag, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import FeatureOrderManager from '../components/settings/FeatureOrderManager';
import DashboardPreferences from '../components/settings/DashboardPreferences';
import QuickActionsSettings from '../components/settings/QuickActionsSettings';
import SoundCloudSettings from '../components/settings/SoundCloudSettings';
import MoodEmojiSettings from '../components/settings/MoodEmojiSettings';
import { getEffectiveUserEmail, isImpersonating } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';
import { useLocation } from 'react-router-dom';

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
  { id: 'PixelsParadise', name: "Pixel's Place" },
];

const accessibilityModes = [
  { id: 'standard', name: 'Standard', description: 'Default text and contrast' },
  { id: 'high_contrast', name: 'High Contrast', description: 'Enhanced contrast' },
  { id: 'large_text', name: 'Large Text', description: 'Larger font sizes' },
  { id: 'adhd_friendly', name: 'ADHD-Friendly', description: 'Checklists & structure' },
  { id: 'autism_friendly', name: 'Autism-Friendly', description: 'Simplified, sensory-friendly' }
];

const bibleVersions = [
  { id: 'NIV', name: 'NIV (New International Version)' },
  { id: 'ESV', name: 'ESV (English Standard Version)' },
  { id: 'NKJV', name: 'NKJV (New King James Version)' },
  { id: 'NLT', name: 'NLT (New Living Translation)' },
  { id: 'NASB', name: 'NASB (New American Standard)' },
  { id: 'KJV', name: 'KJV (King James Version)' },
  { id: 'AMP', name: 'AMP (Amplified Bible)' }
];

export default function Settings() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState(['profile']);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setExpandedSections([section]);
      setTimeout(() => {
        const element = document.querySelector(`[data-section="${section}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location.search]);

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

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;
  const currentlyImpersonating = isImpersonating();

  // Fetch Preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  // Fetch User Profile (for sizes, etc)
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
      share_color: true
    },
    allow_sharing: true
  });

  useEffect(() => {
    if (preferences) {
      setPrefData(preferences.data || preferences); // Handle both wrapped and unwrapped just in case
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
        }
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
    },
  });

  const handleSave = async () => {
    await Promise.all([
      updatePreferencesMutation.mutateAsync(prefData),
      updateUserProfileMutation.mutateAsync(profileData)
    ]);
    setSaveMessage('All settings saved!');
    setTimeout(() => setSaveMessage(''), 3000);
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
    // Add affiliate tag to amazon links
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

  const { isDark, bgClass } = useTheme();

  if (loading || prefsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // --- RENDER HELPERS ---
  const renderProfileSection = () => (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Basic Info */}
        <div className="flex gap-6 flex-col md:flex-row">
          <div className="flex-shrink-0">
            <ImageUploader
              label="Profile Photo"
              currentImage={prefData.profile_image_url}
              onImageChange={(url) => setPrefData({ ...prefData, profile_image_url: url })}
              aspectRatio="square"
              size="small"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nickname</Label>
                <Input 
                  placeholder="What should we call you?" 
                  value={prefData.nickname || ''} 
                  onChange={(e) => setPrefData({ ...prefData, nickname: e.target.value })} 
                />
                <p className="text-xs text-gray-500">Used for your personalized dashboard (e.g. "Pixel's Day")</p>
              </div>

              <div className="space-y-2">
                <Label>Favorite Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={profileData.favorite_color || '#000000'} 
                    onChange={(e) => setProfileData({ ...profileData, favorite_color: e.target.value })} 
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={profileData.favorite_color || ''} 
                    onChange={(e) => setProfileData({ ...profileData, favorite_color: e.target.value })} 
                    placeholder="#000000"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Switch 
                    checked={profileData.privacy_settings?.share_color}
                    onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_color', checked)}
                  />
                  <span className="text-xs text-gray-500">Share publicly</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Location (City, State)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="City" 
                    value={prefData.location_city || ''} 
                    onChange={(e) => setPrefData({ ...prefData, location_city: e.target.value })} 
                  />
                  <Input 
                    placeholder="State" 
                    value={prefData.location_state || ''} 
                    onChange={(e) => setPrefData({ ...prefData, location_state: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recovery Date (Optional)</Label>
                <Input 
                  type="date" 
                  value={profileData.recovery_date || ''} 
                  onChange={(e) => setProfileData({ ...profileData, recovery_date: e.target.value })} 
                />
                <div className="flex items-center gap-2 mt-1">
                  <Switch 
                    checked={profileData.privacy_settings?.share_recovery}
                    onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_recovery', checked)}
                  />
                  <span className="text-xs text-gray-500">Share publicly</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Military Branch</Label>
                <Select 
                  value={profileData.military_branch || ''} 
                  onValueChange={(v) => setProfileData({ ...profileData, military_branch: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>
                    {['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Space Force', 'National Guard', 'Other'].map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Switch 
                    checked={profileData.privacy_settings?.share_military}
                    onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_military', checked)}
                  />
                  <span className="text-xs text-gray-500">Share publicly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sizes & Style */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Shirt className="w-4 h-4" /> Sizes & Style</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Share Sizes</span>
              <Switch 
                checked={profileData.privacy_settings?.share_sizes}
                onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_sizes', checked)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Top</Label><Input value={profileData.clothing_sizes?.top || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'top', e.target.value)} /></div>
            <div><Label className="text-xs">Bottom</Label><Input value={profileData.clothing_sizes?.bottom || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'bottom', e.target.value)} /></div>
            <div><Label className="text-xs">Shoe</Label><Input value={profileData.clothing_sizes?.shoe || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'shoe', e.target.value)} /></div>
            <div><Label className="text-xs">Dress/Suit</Label><Input value={profileData.clothing_sizes?.dress || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'dress', e.target.value)} /></div>
            <div><Label className="text-xs">Ring</Label><Input value={profileData.clothing_sizes?.ring || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'ring', e.target.value)} /></div>
            <div><Label className="text-xs">Hat</Label><Input value={profileData.clothing_sizes?.hat || ''} onChange={(e) => updateProfileNested('clothing_sizes', 'hat', e.target.value)} /></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Style Vibe</Label><Input value={profileData.style_profile?.vibe || ''} onChange={(e) => updateProfileNested('style_profile', 'vibe', e.target.value)} /></div>
            <div><Label>Favorite Brands</Label><Input value={profileData.style_profile?.favorite_brands || ''} onChange={(e) => updateProfileNested('style_profile', 'favorite_brands', e.target.value)} /></div>
          </div>
        </div>

        {/* Wishlist */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Gift className="w-4 h-4" /> Wish List</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Share Wishlist</span>
              <Switch 
                checked={profileData.privacy_settings?.share_wishlist}
                onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_wishlist', checked)}
              />
              <Button size="sm" variant="outline" onClick={addWishItem}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="space-y-2">
            {(profileData.wish_list || []).map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Input placeholder="Item" value={item.item} onChange={(e) => updateWishItem(idx, 'item', e.target.value)} />
                <Input placeholder="Link (Amazon links auto-tagged)" value={item.link} onChange={(e) => updateWishItem(idx, 'link', e.target.value)} />
                <Button size="icon" variant="ghost" onClick={() => removeWishItem(idx)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            ))}
            {profileData.wish_list?.length === 0 && <p className="text-sm text-gray-400 italic">No items yet</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSocialSection = () => (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-semibold">Social Media Profiles</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Share Socials</span>
            <Switch 
              checked={profileData.privacy_settings?.share_socials}
              onCheckedChange={(checked) => updateProfileNested('privacy_settings', 'share_socials', checked)}
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>TikTok</Label><Input placeholder="@username" value={prefData.tiktok_username || ''} onChange={(e) => setPrefData({ ...prefData, tiktok_username: e.target.value })} /></div>
          <div><Label>Discord</Label><Input placeholder="username#1234" value={prefData.discord_username || ''} onChange={(e) => setPrefData({ ...prefData, discord_username: e.target.value })} /></div>
          <div><Label>Instagram URL</Label><Input placeholder="https://instagram.com/..." value={profileData.social_links?.instagram || ''} onChange={(e) => updateProfileNested('social_links', 'instagram', e.target.value)} /></div>
          <div><Label>Facebook URL</Label><Input placeholder="https://facebook.com/..." value={profileData.social_links?.facebook || ''} onChange={(e) => updateProfileNested('social_links', 'facebook', e.target.value)} /></div>
          <div><Label>YouTube URL</Label><Input placeholder="https://youtube.com/..." value={profileData.social_links?.youtube || ''} onChange={(e) => updateProfileNested('social_links', 'youtube', e.target.value)} /></div>
          <div><Label>Twitter/X URL</Label><Input placeholder="https://x.com/..." value={profileData.social_links?.twitter || ''} onChange={(e) => updateProfileNested('social_links', 'twitter', e.target.value)} /></div>
          <div><Label>Twitch URL</Label><Input placeholder="https://twitch.tv/..." value={profileData.social_links?.twitch || ''} onChange={(e) => updateProfileNested('social_links', 'twitch', e.target.value)} /></div>
          <div><Label>Website URL</Label><Input placeholder="https://..." value={profileData.social_links?.website || ''} onChange={(e) => updateProfileNested('social_links', 'website', e.target.value)} /></div>
        </div>

        <div className="border-t pt-4">
          <Label className="mb-2 block">Communities</Label>
          <div className="space-y-2">
            {prefData.communities?.map((community, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                <span>{community.name} ({community.platform})</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    const newComms = prefData.communities.filter((_, i) => i !== idx);
                    setPrefData({ ...prefData, communities: newComms });
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              const newComms = [...(prefData.communities || []), { platform: 'Other', name: 'New Community', link: '' }];
              setPrefData({ ...prefData, communities: newComms });
            }}>
              <Plus className="w-4 h-4 mr-2" /> Add Community
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const onboardingModal = document.querySelector('[data-onboarding-trigger]');
                if (onboardingModal) onboardingModal.click();
                else if (user?.email) {
                  localStorage.removeItem(`onboarding_completed_${user.email}`);
                  window.location.reload();
                }
              }}
              className="text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Setup Tour
            </Button>
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
              disabled={updatePreferencesMutation.isPending || updateUserProfileMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {(updatePreferencesMutation.isPending || updateUserProfileMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. PROFILE */}
          <Collapsible open={expandedSections.includes('profile')} onOpenChange={() => toggleSection('profile')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('profile') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Profile</CardTitle>
                      <CardDescription>Personal details, work schedule, sizes, and wishlist</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('profile') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {renderProfileSection()}
              {/* Work Schedule Link */}
              <Card className="mt-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* 2. SOCIAL */}
          <Collapsible open={expandedSections.includes('social')} onOpenChange={() => toggleSection('social')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('social') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Social</CardTitle>
                      <CardDescription>Social media links and community profiles</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('social') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {renderSocialSection()}
            </CollapsibleContent>
          </Collapsible>

          {/* 3. APPEARANCE */}
          <Collapsible open={expandedSections.includes('appearance')} onOpenChange={() => toggleSection('appearance')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('appearance') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Appearance</CardTitle>
                      <CardDescription>Theme, colors, and visual style</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('appearance') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card><CardContent className="pt-6"><ThemeSelector themeData={prefData} onChange={(data) => setPrefData({ ...prefData, ...data })} /></CardContent></Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. FEATURES (Reordered) */}
          <Collapsible open={expandedSections.includes('features')} onOpenChange={() => toggleSection('features')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('features') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Features</CardTitle>
                      <CardDescription>Enable/disable modules and reorder menu</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('features') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card><CardContent className="pt-6"><FeatureOrderManager enabledModules={prefData.enabled_modules} onChange={(updates) => setPrefData({ ...prefData, ...updates })} /></CardContent></Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. FEATURES (Moved to match new nav order) */}

          {/* 5. DASHBOARD */}
          <Collapsible open={expandedSections.includes('dashboard')} onOpenChange={() => toggleSection('dashboard')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('dashboard') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Dashboard</CardTitle>
                      <CardDescription>My Day view, greetings, and layout</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('dashboard') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
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
            </CollapsibleContent>
          </Collapsible>

          {/* 6. PREFERENCES */}
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
                      <CardDescription>Timezone and general settings</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('preferences') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Label className="mb-2 block">Timezone</Label>
                  <TimezoneSelector value={prefData.user_timezone} onChange={(val) => setPrefData({ ...prefData, user_timezone: val })} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Label className="mb-2 block">Landing Page</Label>
                  <Select value={prefData.default_landing_page} onValueChange={(v) => setPrefData({ ...prefData, default_landing_page: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pageOptions.map(page => <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 7. WIDGETS */}
          <Collapsible open={expandedSections.includes('widgets')} onOpenChange={() => toggleSection('widgets')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('widgets') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`} data-section="widgets">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Widgets</CardTitle>
                      <CardDescription>Quick actions and sound player</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('widgets') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <QuickActionsSettings formData={prefData} setFormData={setPrefData} />
              <MoodEmojiSettings formData={prefData} setFormData={setPrefData} />
              <SoundCloudSettings formData={prefData} setFormData={setPrefData} />
            </CollapsibleContent>
          </Collapsible>

          {/* 8. BIBLE CHOICES (NEW) */}
          <Collapsible open={expandedSections.includes('bible')} onOpenChange={() => toggleSection('bible')}>
            <CollapsibleTrigger className="w-full">
              <Card className={`cursor-pointer transition-all ${expandedSections.includes('bible') ? 'ring-2 ring-purple-300' : 'hover:shadow-md'}`}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">Bible Choices</CardTitle>
                      <CardDescription>Version, reading plans, and prayers</CardDescription>
                    </div>
                  </div>
                  {expandedSections.includes('bible') ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-base">Enable Bible Features</Label>
                    <Switch 
                      checked={prefData.enable_bible_options !== false} // Default to true
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
                        <p className="text-xs text-gray-500">Only accurate, approved translations available.</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Daily Habits</h4>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>Bible Reading</span>
                            <Switch 
                              checked={prefData.enable_daily_reading !== false}
                              onCheckedChange={(checked) => setPrefData({ ...prefData, enable_daily_reading: checked })}
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
                          <h4 className="font-medium">Reading Plans</h4>
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
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
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </div>
    </div>
  );
}