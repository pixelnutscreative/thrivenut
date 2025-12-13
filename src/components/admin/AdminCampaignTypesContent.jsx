import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const defaultCampaignTypes = [
  { type_id: 'tool_promotion', name: 'Tool Promotion', description: 'Promote software tools and SaaS products', is_default: true, display_order: 1 },
  { type_id: 'affiliate_promotion', name: 'Affiliate Promotion', description: 'Promote affiliate offers and programs', is_default: true, display_order: 2 },
  { type_id: 'product_promotion', name: 'Product Promotion', description: 'Promote physical or digital products', is_default: true, display_order: 3 },
  { type_id: 'workshop_course', name: 'Workshop / Course', description: 'Promote educational workshops and courses', is_default: true, display_order: 4 },
  { type_id: 'event_live', name: 'Event / Live', description: 'Promote live events and webinars', is_default: true, display_order: 5 },
  { type_id: 'mlm_network_marketing', name: 'MLM / Network Marketing', description: 'Promote MLM and network marketing opportunities', is_default: true, display_order: 6 },
  { type_id: 'seasonal_promotion', name: 'Seasonal Promotion', description: 'Time-limited seasonal campaigns', is_default: true, display_order: 7 }
];

export default function AdminCampaignTypesContent() {
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ type_id: '', name: '', description: '', is_active: true, is_default: false, display_order: 0 });

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['campaignTypeConfigs'],
    queryFn: async () => {
      const data = await base44.entities.CampaignTypeConfig.list('display_order');
      return data.length > 0 ? data : defaultCampaignTypes;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignTypeConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignTypeConfigs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CampaignTypeConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignTypeConfigs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignTypeConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaignTypeConfigs'] }),
  });

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      type_id: type.type_id,
      name: type.name,
      description: type.description || '',
      is_active: type.is_active !== false,
      is_default: type.is_default || false,
      display_order: type.display_order || 0
    });
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({ type_id: '', name: '', description: '', is_active: true, is_default: false, display_order: types.length + 1 });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingType && editingType.id) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (type) => {
    if (type.id && confirm('Delete this campaign type?')) {
      deleteMutation.mutate(type.id);
    }
  };

  const resetForm = () => {
    setFormData({ type_id: '', name: '', description: '', is_active: true, is_default: false, display_order: 0 });
    setEditingType(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Types</h2>
          <p className="text-sm text-gray-500 mt-1">Configure available campaign types for promotions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      <div className="grid gap-4">
        {types.map((type) => (
          <Card key={type.type_id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <Badge variant="secondary">{type.type_id}</Badge>
                    {type.is_default && <Badge variant="outline">Default</Badge>}
                    {!type.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!type.is_default && type.id && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(type)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Campaign Type' : 'Add Campaign Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Type ID (slug)</Label>
              <Input
                value={formData.type_id}
                onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                placeholder="e.g., tool_promotion"
                disabled={!!editingType}
              />
              <p className="text-xs text-gray-500 mt-1">Used in code - cannot be changed after creation</p>
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tool Promotion"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe when to use this campaign type..."
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Default Type</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.type_id || !formData.name}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Campaign types influence suggested content, default workflows, and timeline structure. Changes here affect how campaigns are created and organized throughout the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}