import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Image as ImageIcon, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeSelector from '../components/onboarding/ThemeSelector';
import ImageUploader from '../components/settings/ImageUploader';

const modules = [
  { id: 'tiktok', name: 'TikTok Content Goals', description: 'Track posts, lives, and engagement' },
  { id: 'goals', name: 'Goals & Habits', description: 'Personal goal tracking' },
  { id: 'wellness', name: 'Wellness Tracker', description: 'Water, sleep, and mood' },
  { id: 'journal', name: 'Daily Journal', description: 'Reflections and thoughts' }
];

const greetingTypes = [
  { id: 'scripture', name: 'Scripture', description: 'Daily Bible verse' },
  { id: 'positive_quote', name: 'Positive Quote', description: 'Uplifting quotes' },
  { id: 'motivational', name: 'Motivational', description: 'Get pumped up!' }
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    enabled_modules: ['tiktok', 'goals', 'wellness', 'journal'],
    profile_image_url: null,
    header_image_url: null,
    background_image_url: null
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
        enabled_modules: preferences.enabled_modules || ['tiktok', 'goals', 'wellness', 'journal'],
        profile_image_url: preferences.profile_image_url || null,
        header_image_url: preferences.header_image_url || null,
        background_image_url: preferences.background_image_url || null
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
      alert('Settings saved successfully! 🎉');
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
          <h1 className="text-3xl font-bold text-gray-800">Settings & Profile</h1>
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

        {/* Profile Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile & Images
              </CardTitle>
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

        {/* Theme Customization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeSelector
                themeData={formData}
                onChange={(data) => setFormData({ ...formData, ...data })}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Daily Greeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formData.greeting_type === greeting.id
                        ? 'border-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.greeting_type === greeting.id && (
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
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

        {/* Enabled Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Modules</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {modules.map(module => (
                <div
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.enabled_modules.includes(module.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={formData.enabled_modules.includes(module.id)} />
                    <div>
                      <h4 className="font-semibold">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}