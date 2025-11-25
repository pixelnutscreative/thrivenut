import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, User, Palette, Eye, Layers, MessageSquare, Clock, Share2, Music } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';
import TimezoneSelector from '../components/shared/TimezoneSelector';
import SpeakButton, { speak } from '../components/accessibility/SpeakButton';

const modules = [
  { id: 'tiktok', name: 'TikTok Content Goals', description: 'Track posts, lives, and engagement' },
  { id: 'gifter', name: 'Gifter Songs & Thank Yous', description: 'Track gifters & generate songs' },
  { id: 'goals', name: 'Personal Goals', description: 'Goal tracking for all areas' },
  { id: 'journal', name: 'Daily Journal', description: 'Reflections and AI reframing' },
  { id: 'wellness', name: 'Wellness Tracker', description: 'Water, sleep, mood & self-care' },
  { id: 'supplements', name: 'Supplements & Vitamins', description: 'Track daily supplements' },
  { id: 'medications', name: 'Medications', description: 'Medication tracking' },
  { id: 'mental_health', name: 'Mental Health', description: 'Mental health support' },
  { id: 'people', name: 'My People', description: 'Contacts & birthdays' },
  { id: 'pets', name: 'Pet Care', description: 'Pet schedules & activities' },
  { id: 'care_reminders', name: 'Care Reminders', description: 'Reminders for others' },
];

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
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setLoading(false);
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    theme_type: 'clean_white',
    metal_accent: 'gold',
    greeting_type: 'positive_quote',
    user_timezone: 'America/New_York',
    enabled_modules: ['tiktok', 'goals', 'wellness', 'journal'],
    profile_image_url: null,
    header_image_url: null,
    background_image_url: null,
    accessibility_mode: 'standard',
    use_text_to_speech: false,
    share_songs_with_pixel: false,
    song_share_email: ''
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        theme_type: preferences.theme_type || 'clean_white',
        metal_accent: preferences.metal_accent,
        pastel_color: preferences.pastel_color,
        bright_color: preferences.bright_color,
        primary_color: preferences.primary_color,
        accent_color: preferences.accent_color,
        greeting_type: preferences.greeting_type || 'positive_quote',
        user_timezone: preferences.user_timezone || 'America/New_York',
        enabled_modules: preferences.enabled_modules || ['tiktok', 'goals', 'wellness', 'journal'],
        profile_image_url: preferences.profile_image_url || null,
        header_image_url: preferences.header_image_url || null,
        background_image_url: preferences.background_image_url || null,
        accessibility_mode: preferences.accessibility_mode || 'standard',
        use_text_to_speech: preferences.use_text_to_speech || false,
        share_songs_with_pixel: preferences.share_songs_with_pixel || false,
        song_share_email: preferences.song_share_email || ''
      });
    }
  }, [preferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return await base44.entities.UserPreferences.update(preferences.id, data);
      } else {
        return await base44.entities.UserPreferences.create({
          user_email: user.email,
          ...data,
          onboarding_completed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated.",
      });
    },
  });

  const toggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      enabled_modules: prev.enabled_modules.includes(moduleId)
        ? prev.enabled_modules.filter(id => id !== moduleId)
        : [...prev.enabled_modules, moduleId]
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
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
          <TabsList className="grid w-full grid-cols-6 mb-6">
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
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Sharing</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Access</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile & Images
                  </CardTitle>
                  <CardDescription>Customize your profile pictures and banner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <ImageUploader
                      label="Profile Picture"
                      currentImage={formData.profile_image_url}
                      onImageChange={(url) => setFormData({ ...formData, profile_image_url: url })}
                      aspectRatio="square"
                    />
                    <ImageUploader
                      label="Header Image"
                      currentImage={formData.header_image_url}
                      onImageChange={(url) => setFormData({ ...formData, header_image_url: url })}
                      aspectRatio="banner"
                    />
                  </div>
                  <ImageUploader
                    label="Custom Background (MySpace vibes ✨)"
                    currentImage={formData.background_image_url}
                    onImageChange={(url) => setFormData({ ...formData, background_image_url: url })}
                    aspectRatio="wide"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
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

          {/* Modules Tab */}
          <TabsContent value="modules">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Active Modules
                  </CardTitle>
                  <CardDescription>Choose which features to enable in your app</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  {modules.map(module => (
                    <div
                      key={module.id}
                      onClick={() => {
                        toggleModule(module.id);
                        if (formData.use_text_to_speech) {
                          const action = formData.enabled_modules.includes(module.id) ? 'disabled' : 'enabled';
                          speak(`${module.name} ${action}`);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.enabled_modules.includes(module.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={formData.enabled_modules.includes(module.id)} />
                          <div>
                            <h4 className="font-semibold">{module.name}</h4>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                        </div>
                        {formData.use_text_to_speech && (
                          <SpeakButton text={`${module.name}. ${module.description}`} />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Preferences Tab */}
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
            </motion.div>
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Song Sharing Settings
                  </CardTitle>
                  <CardDescription>Configure who can receive your generated gifter songs for help and collaboration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    onClick={() => setFormData({ ...formData, share_songs_with_pixel: !formData.share_songs_with_pixel })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.share_songs_with_pixel
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={formData.share_songs_with_pixel} />
                      <div>
                        <h4 className="font-semibold">Share with PixelNutsCreative</h4>
                        <p className="text-sm text-gray-600">Automatically share all generated songs with PixelNutsCreative@gmail.com for help and collaboration</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Custom Collaboration Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter an email to share songs with..."
                      value={formData.song_share_email}
                      onChange={(e) => setFormData({ ...formData, song_share_email: e.target.value })}
                    />
                    <p className="text-sm text-gray-500">
                      Songs will automatically be shared with this email when generated. Great for collaborating with friends or getting feedback!
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-2">💜 How Sharing Works</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• When you generate a song, it will be emailed to your selected recipients</li>
                      <li>• Recipients can see the gifter details and song lyrics</li>
                      <li>• Great for getting feedback or collaborating on creative ideas</li>
                      <li>• You can still copy songs manually to share elsewhere</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Accessibility
                  </CardTitle>
                  <CardDescription>Customize the interface for your needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Visual Mode</h4>
                    {accessibilityModes.map(mode => (
                      <div
                        key={mode.id}
                        onClick={() => {
                          setFormData({ ...formData, accessibility_mode: mode.id });
                          if (formData.use_text_to_speech) {
                            speak(`${mode.name}. ${mode.description}`);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.accessibility_mode === mode.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.accessibility_mode === mode.id
                                ? 'border-purple-500'
                                : 'border-gray-300'
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
                          {formData.use_text_to_speech && (
                            <SpeakButton text={`${mode.name}. ${mode.description}`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div
                      onClick={() => {
                        const newValue = !formData.use_text_to_speech;
                        setFormData({ ...formData, use_text_to_speech: newValue });
                        if (newValue) {
                          speak('Text to speech enabled.');
                        }
                      }}
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
                          <p className="text-sm text-gray-600">Hear options read aloud</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}