import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

const FEATURES_LIST = [
  // Core
  { id: 'my_resources', name: 'My Stuff' },
  { id: 'my_groups', name: 'My Groups' },
  { id: 'pixels_place', name: "Pixel's Place" },

  // Goals + Growth
  { id: 'quick_notes', name: 'Quick Notes' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'habits', name: 'Habits' },
  { id: 'goals', name: 'Goals' },
  { id: 'vision_board', name: 'Vision Board' },
  { id: 'journal', name: 'Journal' },
  { id: 'finance', name: 'Finance' },

  // Friends + Loved Ones
  { id: 'people', name: 'Family & People' },
  { id: 'parenting', name: 'Kid Controls' },
  { id: 'care_reminders', name: 'Care Reminders' },
  { id: 'pets', name: 'Pet Care' },

  // Faith & Spiritual
  { id: 'prayer', name: 'Prayer Requests' },
  { id: 'holy_hitmakers', name: 'Holy Hitmakers' },
  // bible_resources removed as requested

  // Mind + Body Health
  { id: 'mental_health', name: 'Mental Health' },
  { id: 'wellness', name: 'Daily Wellness' },
  { id: 'supplements', name: 'Supplements' },
  { id: 'medications', name: 'Medications' },
  { id: 'activity', name: 'Activity Tracker' },

  // Creator Suite
  { id: 'content_creator_center', name: 'Content Creator Center' },
  { id: 'motivations', name: 'Content Ideas' },
  { id: 'content_marketplace', name: 'Content Marketplace' },
  { id: 'ai_music_suite', name: 'Create AI Music' },
  { id: 'tiktok', name: 'Social Media Suite' },

  // Share & Earn
  { id: 'share_earn', name: 'Share & Earn' },
];

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['featureFlags'],
    queryFn: async () => {
      const allFlags = await base44.entities.FeatureFlag.list();
      return allFlags;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled, recordId }) => {
      if (recordId) {
        return base44.entities.FeatureFlag.update(recordId, { is_enabled: isEnabled });
      } else {
        return base44.entities.FeatureFlag.create({ 
          feature_id: id, 
          is_enabled: isEnabled,
          label: FEATURES_LIST.find(f => f.id === id)?.name || id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  }

  const getFlagStatus = (featureId) => {
    const flag = flags?.find(f => f.feature_id === featureId);
    // If no flag record exists, default is ON (true)
    return {
      isEnabled: flag ? flag.is_enabled : true,
      recordId: flag?.id
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Global Feature Flags:</strong> Turning a feature OFF here hides it for ALL non-admin users. 
          Admins will still see it with a "DEV" indicator. Use this for works-in-progress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES_LIST.map((feature) => {
          const { isEnabled, recordId } = getFlagStatus(feature.id);
          
          return (
            <Card key={feature.id} className={!isEnabled ? "border-amber-200 bg-amber-50/30" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{feature.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{feature.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isEnabled && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">DEV MODE</Badge>}
                  <Switch 
                    checked={isEnabled}
                    onCheckedChange={(checked) => toggleMutation.mutate({ 
                      id: feature.id, 
                      isEnabled: checked, 
                      recordId 
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}