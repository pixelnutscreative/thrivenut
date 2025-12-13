import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Save, Trash2 } from 'lucide-react';

const platformIcons = {
  TikTok: '🎵',
  YouTube: '▶️',
  Facebook: '👤',
  LinkedIn: '💼',
  Pinterest: '📌',
  Email: '📧',
  SMS: '💬'
};

export default function PlatformOutputTabs({ contentCardId, contentType, isLocked }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('');

  const { data: platforms = [] } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: async () => {
      const data = await base44.entities.PlatformConfig.filter({ is_enabled: true }, 'display_order');
      return data;
    },
  });

  const { data: outputs = [] } = useQuery({
    queryKey: ['platformOutputs', contentCardId],
    queryFn: () => base44.entities.ContentPlatformOutput.filter({ content_card_id: contentCardId }),
    enabled: !!contentCardId,
  });

  const createOutputMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentPlatformOutput.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformOutputs'] }),
  });

  const updateOutputMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentPlatformOutput.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformOutputs'] }),
  });

  const deleteOutputMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentPlatformOutput.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformOutputs'] }),
  });

  const getOutputForPlatform = (platformId) => {
    return outputs.find(o => o.platform === platformId);
  };

  const handleAddPlatform = (platformId) => {
    createOutputMutation.mutate({
      content_card_id: contentCardId,
      platform: platformId,
      caption_or_copy: '',
      seo_keywords: '',
      hook: '',
      cta: '',
      schedule_datetime: '',
      platform_notes: ''
    });
  };

  const handleUpdateOutput = (output, field, value) => {
    updateOutputMutation.mutate({
      id: output.id,
      data: { ...output, [field]: value }
    });
  };

  const handleRemovePlatform = (outputId) => {
    if (confirm('Remove this platform output?')) {
      deleteOutputMutation.mutate(outputId);
    }
  };

  React.useEffect(() => {
    if (platforms.length > 0 && !activeTab) {
      setActiveTab(platforms[0].platform_id);
    }
  }, [platforms]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Outputs</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1">
            {platforms.map(platform => {
              const output = getOutputForPlatform(platform.platform_id);
              return (
                <TabsTrigger key={platform.platform_id} value={platform.platform_id}>
                  <span className="mr-1">{platformIcons[platform.platform_id] || platform.icon}</span>
                  {platform.display_label}
                  {output && <span className="ml-1 text-green-600">✓</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {platforms.map(platform => {
            const output = getOutputForPlatform(platform.platform_id);

            return (
              <TabsContent key={platform.platform_id} value={platform.platform_id} className="space-y-4 mt-4">
                {!output ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No output created for {platform.display_label} yet</p>
                    <Button onClick={() => handleAddPlatform(platform.platform_id)} disabled={isLocked}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add {platform.display_label} Output
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Caption / Copy</Label>
                      <Textarea
                        value={output.caption_or_copy || ''}
                        onChange={(e) => handleUpdateOutput(output, 'caption_or_copy', e.target.value)}
                        rows={4}
                        placeholder={`Write your ${platform.display_label} caption...`}
                        disabled={isLocked}
                      />
                    </div>

                    <div>
                      <Label>Hook</Label>
                      <Input
                        value={output.hook || ''}
                        onChange={(e) => handleUpdateOutput(output, 'hook', e.target.value)}
                        placeholder="Opening hook..."
                        disabled={isLocked}
                      />
                    </div>

                    <div>
                      <Label>Call to Action</Label>
                      <Input
                        value={output.cta || ''}
                        onChange={(e) => handleUpdateOutput(output, 'cta', e.target.value)}
                        placeholder="CTA..."
                        disabled={isLocked}
                      />
                    </div>

                    <div>
                      <Label>SEO Keywords</Label>
                      <Input
                        value={output.seo_keywords || ''}
                        onChange={(e) => handleUpdateOutput(output, 'seo_keywords', e.target.value)}
                        placeholder="Keywords, hashtags..."
                        disabled={isLocked}
                      />
                    </div>

                    <div>
                      <Label>Schedule Date/Time</Label>
                      <Input
                        type="datetime-local"
                        value={output.schedule_datetime ? new Date(output.schedule_datetime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleUpdateOutput(output, 'schedule_datetime', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        disabled={isLocked}
                      />
                    </div>

                    <div>
                      <Label>Platform Notes</Label>
                      <Textarea
                        value={output.platform_notes || ''}
                        onChange={(e) => handleUpdateOutput(output, 'platform_notes', e.target.value)}
                        rows={2}
                        placeholder="Platform-specific notes..."
                        disabled={isLocked}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePlatform(output.id)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                        Remove Platform
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}