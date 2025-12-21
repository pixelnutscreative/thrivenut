import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import ImageUploader from '../settings/ImageUploader';

export default function AdminPlatformConfig() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: () => base44.entities.PlatformConfig.list(),
  });

  const getConfigValue = (key) => {
    const config = configs.find(c => c.config_key === key);
    return config?.config_value || '';
  };

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = configs.find(c => c.config_key === key);
      if (existing) {
        return await base44.entities.PlatformConfig.update(existing.id, { config_value: value });
      } else {
        return await base44.entities.PlatformConfig.create({
          config_key: key,
          config_value: value,
          description: `Logo for ${key}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformConfigs'] });
    },
  });

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin mx-auto" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Pixel's AI Toolbox</Label>
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageUploader
                currentImage={getConfigValue('pixels_toolbox_logo')}
                onImageChange={(url) => updateConfigMutation.mutate({ key: 'pixels_toolbox_logo', value: url })}
                size="small"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Let's Go Nuts</Label>
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageUploader
                currentImage={getConfigValue('lets_go_nuts_logo')}
                onImageChange={(url) => updateConfigMutation.mutate({ key: 'lets_go_nuts_logo', value: url })}
                size="small"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <Label className="text-lg font-semibold">NutPals Gallery</Label>
          <div className="space-y-2">
            <Label>Default Song URL (SoundCloud)</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://soundcloud.com/..." 
                defaultValue={getConfigValue('default_nutpal_song')}
                onBlur={(e) => updateConfigMutation.mutate({ key: 'default_nutpal_song', value: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">Plays in NutPal gallery if no specific song is set for the style.</p>
          </div>
        </div>
      </CardContent
    </Card>
  );
}