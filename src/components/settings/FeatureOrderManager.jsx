import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

const allFeatures = [
  // Life + Organization
  { id: 'brain_dump', name: 'Brain Dump', description: 'Get ideas out of your head' },
  { id: 'work', name: 'Work Schedules', description: 'Track work hours and shifts' },
  { id: 'household', name: 'Household', description: 'Cleaning tasks and household rules' },
  
  // Friends + Loved Ones
  { id: 'people', name: 'Family Members', description: 'Track family details and sizes' },
  { id: 'care_reminders', name: 'Care Reminders', description: 'Reminders for caregiving' },
  { id: 'pets', name: 'Pet Care', description: 'Pet schedules & activities' },
  
  // Goals + Growth
  { id: 'tasks', name: 'Tasks', description: 'Daily to-do lists' },
  { id: 'habits', name: 'Habits', description: 'Daily habit tracking' },
  { id: 'goals', name: 'Goals', description: 'Long-term goal tracking' },
  { id: 'journal', name: 'Journal', description: 'Daily reflections and AI reframing' },
  { id: 'quick_notes', name: 'Quick Notes', description: 'Simple note taking' },
  
  // Faith & Spiritual
  { id: 'prayer', name: 'Prayer Requests', description: 'Prayer list and spiritual tracking' },
  
  // Mind + Body Health
  { id: 'mental_health', name: 'Mental Health', description: 'Mental health support tools' },
  { id: 'wellness', name: 'Daily Wellness', description: 'Water, sleep, mood & self-care' },
  { id: 'supplements', name: 'Supplements', description: 'Track daily supplements' },
  { id: 'medications', name: 'Medications', description: 'Medication tracking' },
  
  // Creator Suite
  { id: 'tiktok', name: 'Social Media Suite', description: 'Content calendar, engagement & creator contacts', requiresTikTokAccess: true },
  { id: 'motivations', name: 'Content Ideas', description: 'Saved ideas and inspirations' },
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
              className={`transition-all ${isEnabled ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 opacity-60'}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isEnabled ? (
                    <Eye className="w-4 h-4 text-purple-500" />
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