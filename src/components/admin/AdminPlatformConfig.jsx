import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '../shared/useTheme';

export default function AdminPlatformConfig() {
  const queryClient = useQueryClient();
  const { user } = useTheme();

  const { data: configs = [] } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: () => base44.entities.PlatformConfig.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async (config) => {
      if (config.id) {
        return base44.entities.PlatformConfig.update(config.id, config);
      } else {
        return base44.entities.PlatformConfig.create(config);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platformConfigs']);
      queryClient.invalidateQueries(['platformConfigAnnouncements']);
    }
  });

  const toggleFeature = (id, label, isEnabled) => {
    const existing = configs.find(c => c.platform_id === id);
    updateMutation.mutate({
      id: existing?.id,
      platform_id: id,
      display_label: label,
      is_enabled: isEnabled,
      display_order: 0
    });
  };

  const isAnnouncementsEnabled = configs.find(c => c.platform_id === 'global_announcements')?.is_enabled !== false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Feature Toggles</CardTitle>
        <CardDescription>Enable or disable global platform features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Global Announcement Bar</Label>
            <p className="text-sm text-gray-500">
              Show the scrolling announcement bar at the top of the entire app.
            </p>
          </div>
          <Switch
            checked={isAnnouncementsEnabled}
            onCheckedChange={(checked) => toggleFeature('global_announcements', 'Global Announcements', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}