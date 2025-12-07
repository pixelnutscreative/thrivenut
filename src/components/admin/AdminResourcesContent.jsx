import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ExternalLink, Loader2, GripVertical } from 'lucide-react';

const categories = ['AI', 'Creative', 'Business', 'Learning', 'Workshops', 'Community', 'Custom GPT'];

const defaultResource = {
  name: '',
  description: '',
  link: '',
  badge: '',
  category: 'AI',
  keywords: [],
  sort_order: 100,
  is_active: true,
  is_featured: false,
  is_recurring: false,
  schedule: ''
};

export default function AdminResourcesContent() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState(defaultResource);
  const [keywordsInput, setKeywordsInput] = useState('');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['designResources'],
    queryFn: () => base44.entities.DesignResource.list('sort_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DesignResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designResources'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DesignResource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designResources'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DesignResource.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designResources'] })
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingResource(null);
    setFormData(defaultResource);
    setKeywordsInput('');
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name || '',
      description: resource.description || '',
      link: resource.link || '',
      badge: resource.badge || '',
      category: Array.isArray(resource.category) ? resource.category[0] : (resource.category || 'AI'),
      keywords: resource.keywords || [],
      sort_order: resource.sort_order || 100,
      is_active: resource.is_active !== false,
      is_featured: resource.is_featured || false,
      is_recurring: resource.is_recurring || false,
      schedule: resource.schedule || ''
    });
    setKeywordsInput((resource.keywords || []).join(', '));
    setShowForm(true);
  };

  const handleSubmit = () => {
    const keywords = keywordsInput.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const data = { 
      ...formData, 
      keywords,
      category: Array.isArray(formData.category) ? formData.category : [formData.category]
    };
    
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Design Resources</h2>
          <p className="text-gray-500">Manage Pixel's Paradise resources</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Resource
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card key={resource.id} className={`${!resource.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-gray-300" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{resource.name}</span>
                    <Badge variant="outline" className="text-xs">{Array.isArray(resource.category) ? resource.category[0] : resource.category}</Badge>
                    {resource.badge && <Badge className="text-xs bg-purple-100 text-purple-700">{resource.badge}</Badge>}
                    {resource.is_featured && <Badge className="text-xs bg-yellow-100 text-yellow-700">⭐ Featured</Badge>}
                    {resource.is_recurring && <Badge className="text-xs bg-green-100 text-green-700">🔄 Recurring</Badge>}
                    {!resource.is_active && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resource.keywords?.slice(0, 5).map(k => (
                      <span key={k} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{k}</span>
                    ))}
                    {resource.keywords?.length > 5 && (
                      <span className="text-xs text-gray-400">+{resource.keywords.length - 5} more</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(resource.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(resource)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (confirm('Delete this resource?')) {
                        deleteMutation.mutate(resource.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {resources.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No resources yet. Click "Add Resource" to get started.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Magai"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this tool does"
                rows={2}
              />
            </div>
            <div>
              <Label>Link *</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Badge</Label>
                <Input
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="🔥 Recommended"
                />
              </div>
            </div>
            <div>
              <Label>Keywords (comma separated)</Label>
              <Textarea
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="ai, video, music, create"
                rows={2}
              />
              <p className="text-xs text-gray-500 mt-1">Used for search matching</p>
            </div>
            <div>
              <Label>Schedule (for recurring classes)</Label>
              <Input
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Weekdays 3pm PST"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>⭐ Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                  <Label>🔄 Recurring</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving || !formData.name || !formData.link}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingResource ? 'Save Changes' : 'Add Resource'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}