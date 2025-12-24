import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

const allFeatures = [
  // Goals + Growth
  { id: 'quick_notes', name: 'Quick Notes', description: 'Simple note taking' },
  { id: 'tasks', name: 'Tasks', description: 'Includes cleaning, household, and brain dump' },
  { id: 'habits', name: 'Habits', description: 'Daily habit tracking' },
  { id: 'goals', name: 'Goals', description: 'Long-term goal tracking & vision board' },
  { id: 'journal', name: 'Journal', description: 'Daily reflections' },
  { id: 'finance', name: 'Finance', description: 'Subscriptions and expenses' },

  // Friends + Loved Ones
  { id: 'people', name: 'Family & People', description: 'Family members and contacts' },
  { id: 'care_reminders', name: 'Care Reminders', description: 'Caregiving tasks' },
  { id: 'pets', name: 'Pet Care', description: 'Pet schedules' },

  // Faith & Spiritual
  { id: 'prayer', name: 'Prayer Requests', description: 'Or Send Light & Love' },

  // Mind + Body Health
  { id: 'mental_health', name: 'Mental Health', description: 'Support tools' },
  { id: 'wellness', name: 'Daily Wellness', description: 'Water, sleep, mood, self-care' },
  { id: 'supplements', name: 'Supplements', description: 'Daily supplements' },
  { id: 'medications', name: 'Medications', description: 'Medication tracking' },
  { id: 'activity', name: 'Activity Tracker', description: 'Log movement and workouts' },

  // Creator Suite
  { id: 'tiktok', name: 'Social Media Suite', description: 'Full creator toolkit', requiresTikTokAccess: true },
  { id: 'motivations', name: 'Content Ideas', description: 'Saved inspirations' },
  { id: 'content_marketplace', name: 'Content Marketplace', description: 'Buy & sell designs' },
  { id: 'affiliate', name: 'Affiliate Programs', description: 'Track your links' },
  { id: 'my_resources', name: 'My Resources', description: 'Saved files & links' },
  
  // Parenting
  { id: 'parenting', name: 'Parenting & Kids', description: 'Child journals & controls' },
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
                    <Eye className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-sm">{feature.name}</p>
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