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
  { id: 'tool_promotion', name: 'Tool Promotion', description: 'Promote software tools and SaaS products' },
  { id: 'affiliate_promotion', name: 'Affiliate Promotion', description: 'Promote affiliate offers and programs' },
  { id: 'product_promotion', name: 'Product Promotion', description: 'Promote physical or digital products' },
  { id: 'workshop_course', name: 'Workshop / Course', description: 'Promote educational workshops and courses' },
  { id: 'event_live', name: 'Event / Live', description: 'Promote live events and webinars' },
  { id: 'mlm_network_marketing', name: 'MLM / Network Marketing', description: 'Promote MLM and network marketing opportunities' },
  { id: 'seasonal_promotion', name: 'Seasonal Promotion', description: 'Time-limited seasonal campaigns' }
];

export default function AdminCampaignTypesContent() {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', is_active: true });

  // Since campaign types are enums, we'll display the defaults as reference
  // In a real implementation, you might store these in a CampaignTypeConfig entity

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({ ...type, is_active: true });
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({ id: '', name: '', description: '', is_active: true });
    setShowDialog(true);
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
        {defaultCampaignTypes.map((type) => (
          <Card key={type.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <Badge variant="secondary">{type.id}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(type)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
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
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
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
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowDialog(false)} className="flex-1">
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