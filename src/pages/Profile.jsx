import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Sparkles, Briefcase, ChevronDown, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';
import ProfileFavoritesTab from '../components/contacts/ProfileFavoritesTab';
import MomentsTabContent from '../components/contacts/MomentsTabContent';
import AccountDeletionTab from '../components/settings/AccountDeletionTab';

const AFFILIATE_TAG = 'pixelnuts-20';

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email)?.toLowerCase() : null;

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      if (prefs.length > 1) {
        const withData = prefs.find(p => p.nickname || p.profile_image_url || (p.enabled_modules && p.enabled_modules.length > 0));
        if (withData) return withData;
      }
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', effectiveEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: effectiveEmail });
      if (profiles.length > 1) {
        const withData = profiles.find(p => p.phone || p.nickname || (p.social_links && Object.values(p.social_links).some(v => v)));
        if (withData) return withData;
      }
      return profiles[0] || null;
    },
    enabled: !!effectiveEmail,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
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

  const [prefsInitialized, setPrefsInitialized] = useState(false);
  const [profileInitialized, setProfileInitialized] = useState(false);

  useEffect(() => {
    if (preferences && !prefsInitialized) {
      setPrefData({
        nickname: '',
        profile_image_url: '',
        tiktok_username: '',
        ...preferences
      });
      setPrefsInitialized(true);
    }
  }, [preferences, prefsInitialized]);

  useEffect(() => {
    if (userProfile && !profileInitialized) {
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
          share_creator_info: true,
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
        started_going_live: userProfile.started_going_live || '',
        clubs: userProfile.clubs || [],
        custom_clubs: userProfile.custom_clubs || []
      });
      setProfileInitialized(true);
    }
  }, [userProfile, profileInitialized]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = { ...data };
      const targetId = preferences?.id || data.id; 
      delete cleanData.id;
      delete cleanData.created_date;
      delete cleanData.updated_date;
      delete cleanData.created_by;
      
      if (targetId) {
        return await base44.entities.UserPreferences.update(targetId, cleanData);
      } else {
        const existing = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
        if (existing.length > 0) {
           return await base44.entities.UserPreferences.update(existing[0].id, cleanData);
        }
        return await base44.entities.UserPreferences.create({
          user_email: effectiveEmail,
          ...cleanData,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', effectiveEmail] });
      queryClient.refetchQueries({ queryKey: ['preferences', effectiveEmail] });
    },
  });

  const updateUserProfileMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await base44.entities.UserProfile.filter({ user_email: effectiveEmail });
      let targetId = null;
      if (existing.length > 0) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const handleSave = async () => {
    setSaveStatus('saving');
    const promises = [];
    
    if (prefData && Object.keys(prefData).length > 0) {
      promises.push(updatePreferencesMutation.mutateAsync(prefData));
    }
    
    if (profileData) {
      promises.push(updateUserProfileMutation.mutateAsync(profileData));
    }
    
    try {
      if (promises.length > 0) {
        await Promise.all(promises);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
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

  const getSaveButtonStyle = () => {
    if (saveStatus === 'saved') return { backgroundColor: '#22c55e', borderColor: '#22c55e' };
    return {};
  };

  const updateProfileNested = (category, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
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
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <Button 
            onClick={handleSave} 
            disabled={saveStatus === 'saving'}
            style={getSaveButtonStyle()}
            className={saveStatus === 'saved' ? 'text-white' : ''}
          >
            {getSaveButtonIcon()}
            {getSaveButtonText()}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Profile Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
                        real_name: profileData.real_name || user?.full_name,
                        image_url: prefData.profile_image_url,
                        color: profileData.favorite_color,
                        clubs: profileData.clubs || [],
                        custom_clubs: profileData.custom_clubs || []
                      }} 
                      setFormData={(newData) => {
                        setProfileData(prev => ({
                          ...prev,
                          real_name: newData.real_name,
                          nickname: newData.nickname,
                          favorite_color: newData.color,
                          clubs: newData.clubs || [],
                          custom_clubs: newData.custom_clubs || []
                        }));

                        setPrefData(prev => ({ 
                          ...prev, 
                          nickname: newData.nickname,
                          profile_image_url: newData.image_url 
                        }));
                      }}
                      onSave={() => handleSave()}
                      isSaving={updatePreferencesMutation.isPending || updateUserProfileMutation.isPending}
                      isEditing={true}
                      showIrlToggle={false}
                      isProfile={true}
                      primaryColor={primaryColor}
                      hideSaveButtons={true}
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
                            tiktok_username: profileData.tiktok_username
                            }}
                            setFormData={(newData) => {
                            setProfileData(prev => ({ 
                              ...prev, 
                              ...newData,
                              tiktok_username: newData.username
                            }));
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

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 font-semibold text-lg hover:bg-gray-50 transition-colors rounded-t-lg">
                  <h2>Delete Account</h2>
                  <ChevronDown className="w-5 h-5 data-[state=open]:rotate-180 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AccountDeletionTab userEmail={effectiveEmail} />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}