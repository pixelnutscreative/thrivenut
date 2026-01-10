import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

const allFeatures = [
  // Core
  { id: 'my_resources', name: 'My Stuff', description: 'Your saved resources', color: 'text-gray-500' },
  { id: 'my_groups', name: 'My Groups', description: 'Browse and manage your groups', color: 'text-gray-500' },
  { id: 'pixels_place', name: "Pixel's Place", description: 'Community resources and tools', color: 'text-gray-500' },

  // Goals + Growth
  { id: 'quick_notes', name: 'Quick Notes', description: 'Simple note taking', color: 'text-purple-400' },
  { id: 'tasks', name: 'Tasks', description: 'Includes cleaning, household, and brain dump', color: 'text-purple-400' },
  { id: 'habits', name: 'Habits', description: 'Daily habit tracking', color: 'text-purple-400' },
  { id: 'goals', name: 'Goals', description: 'Long-term goal tracking', color: 'text-purple-400' },
  { id: 'vision_board', name: 'Vision Board', description: 'Visualize your dreams', color: 'text-purple-400' },
  { id: 'journal', name: 'Journal', description: 'Daily reflections', color: 'text-purple-400' },
  { id: 'finance', name: 'Finance', description: 'Subscriptions and expenses', color: 'text-purple-400' },

  // Friends + Loved Ones
  { id: 'people', name: 'Family & People', description: 'Family members and contacts', color: 'text-blue-400' },
  { id: 'parenting', name: 'Kid Controls', description: 'Manage kids\' access and tasks', color: 'text-blue-400' },
  { id: 'care_reminders', name: 'Care Reminders', description: 'Caregiving tasks', color: 'text-blue-400' },
  { id: 'pets', name: 'Pet Care', description: 'Pet schedules', color: 'text-blue-400' },

  // Faith & Spiritual
  { id: 'prayer', name: 'Prayer Requests', description: 'Or Send Light & Love', color: 'text-teal-400' },
  { id: 'holy_hitmakers', name: 'Holy Hitmakers', description: 'Faith-based AI music generation', color: 'text-teal-400' },

  // Mind + Body Health
  { id: 'mental_health', name: 'Mental Health', description: 'Support tools', color: 'text-lime-400' },
  { id: 'wellness', name: 'Daily Wellness', description: 'Water, sleep, mood, self-care', color: 'text-lime-400' },
  { id: 'supplements', name: 'Supplements', description: 'Daily supplements', color: 'text-lime-400' },
  { id: 'medications', name: 'Medications', description: 'Medication tracking', color: 'text-lime-400' },
  { id: 'activity', name: 'Activity Tracker', description: 'Log movement and workouts', color: 'text-lime-400' },

  // Creator Suite
  { id: 'content_creator_center', name: 'Content Creator Center', description: 'Your hub for content strategy', color: 'text-yellow-400' },
  { id: 'motivations', name: 'Content Ideas', description: 'Saved inspirations', color: 'text-yellow-400' },
  { id: 'content_marketplace', name: 'Content Marketplace', description: 'Buy & sell designs', color: 'text-yellow-400' },
  { id: 'ai_music_suite', name: 'Create AI Music', description: 'Generators for various song types', color: 'text-yellow-400' },
  { id: 'tiktok', name: 'Social Media Suite', description: 'Full creator toolkit', color: 'text-orange-400', requiresTikTokAccess: true },

  // Share & Earn
  { id: 'share_earn', name: 'Share & Earn', description: 'Affiliate links & generators', color: 'text-pink-400' },
];

export default function FeatureOrderManager({ enabledModules, onChange }) {
  const toggleFeature = (featureId) => {
    const currentEnabled = enabledModules || [];
    const newEnabled = currentEnabled.includes(featureId)
      ? currentEnabled.filter(id => id !== featureId)
      : [...currentEnabled, featureId];
    
    onChange({ enabled_modules: newEnabled });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Toggle features on/off to show or hide them in your menu.
      </p>
      
      <div className="space-y-2">
        {allFeatures.map((feature) => {
          const isEnabled = enabledModules?.includes(feature.id);
          return (
            <Card 
              key={feature.id}
              className={`transition-all ${isEnabled ? '' : 'border-gray-200 opacity-60'}`}
              style={isEnabled ? {
                borderColor: 'color-mix(in srgb, var(--accent-color) 30%, white)',
                backgroundColor: 'color-mix(in srgb, var(--accent-color) 5%, white)'
              } : {}}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isEnabled ? (
                    <Eye className={`w-4 h-4 ${feature.color || ''}`} style={!feature.color ? { color: 'var(--accent-color)' } : {}} />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium text-sm ${isEnabled ? feature.color : 'text-gray-600'}`}>{feature.name}</p>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>

                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleFeature(feature.id)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}