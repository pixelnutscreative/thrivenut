import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Save, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const defaultPlatforms = [
  { platform_id: 'TikTok', display_label: 'TikTok', icon: '🎵', display_order: 1 },
  { platform_id: 'YouTube', display_label: 'YouTube', icon: '▶️', display_order: 2 },
  { platform_id: 'Facebook', display_label: 'Facebook', icon: '👤', display_order: 3 },
  { platform_id: 'LinkedIn', display_label: 'LinkedIn', icon: '💼', display_order: 4 },
  { platform_id: 'Pinterest', display_label: 'Pinterest', icon: '📌', display_order: 5 },
  { platform_id: 'Email', display_label: 'Email', icon: '📧', display_order: 6 },
  { platform_id: 'SMS', display_label: 'SMS', icon: '💬', display_order: 7 }
];

export default function AdminPlatformsContent() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState({
    platform_id: '',
    display_label: '',
    is_enabled: true,
    display_order: 0,
    icon: ''
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: async () => {
      const data = await base44.entities.PlatformConfig.list('display_order');
      return data.length > 0 ? data : defaultPlatforms;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlatformConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformConfigs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlatformConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformConfigs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlatformConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformConfigs'] }),
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(platforms);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    for (let i = 0; i < items.length; i++) {
      if (items[i].id) {
        await base44.entities.PlatformConfig.update(items[i].id, { display_order: i + 1 });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['platformConfigs'] });
  };

  const handleAdd = () => {
    setEditingPlatform(null);
    setFormData({
      platform_id: '',
      display_label: '',
      is_enabled: true,
      display_order: platforms.length + 1,
      icon: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (platform) => {
    setEditingPlatform(platform);
    setFormData({
      platform_id: platform.platform_id,
      display_label: platform.display_label,
      is_enabled: platform.is_enabled !== false,
      display_order: platform.display_order || 0,
      icon: platform.icon || ''
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingPlatform && editingPlatform.id) {
      updateMutation.mutate({ id: editingPlatform.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (platform) => {
    if (platform.id && confirm(`Delete ${platform.display_label}?`)) {
      deleteMutation.mutate(platform.id);
    }
  };

  const resetForm = () => {
    setFormData({
      platform_id: '',
      display_label: '',
      is_enabled: true,
      display_order: 0,
      icon: ''
    });
    setEditingPlatform(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platforms</h2>
          <p className="text-sm text-gray-500 mt-1">Manage content publishing platforms</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="platforms">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {platforms.map((platform, index) => (
                <Draggable key={platform.platform_id} draggableId={platform.platform_id} index={index}>
                  {(provided) => (
                    <Card ref={provided.innerRef} {...provided.draggableProps}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {platform.icon && <span className="text-2xl">{platform.icon}</span>}
                              <h3 className="font-semibold">{platform.display_label}</h3>
                              <Badge variant="secondary">{platform.platform_id}</Badge>
                              {!platform.is_enabled && <Badge variant="destructive">Disabled</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(platform)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {platform.id && (
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(platform)}>
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlatform ? 'Edit Platform' : 'Add Platform'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Platform ID</Label>
              <Input
                value={formData.platform_id}
                onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                placeholder="e.g., Instagram"
                disabled={!!editingPlatform}
              />
              <p className="text-xs text-gray-500 mt-1">Used in code - cannot be changed after creation</p>
            </div>

            <div>
              <Label>Display Label</Label>
              <Input
                value={formData.display_label}
                onChange={(e) => setFormData({ ...formData, display_label: e.target.value })}
                placeholder="e.g., Instagram"
              />
            </div>

            <div>
              <Label>Icon (emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 📱"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={!formData.platform_id || !formData.display_label}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Drag platforms to reorder. Disabled platforms won't appear in content scheduling dropdowns. Platform IDs must match those used in ContentPlatformOutput entity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}