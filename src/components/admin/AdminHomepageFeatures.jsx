import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Star, Heart, Users, Zap, Award, Smile, ThumbsUp, Activity, Sun, Moon, Cloud, Search, Filter, Settings, Check, X } from 'lucide-react';

const SECTIONS = [
  { value: 'free', label: 'Free Features' },
  { value: 'neurodivergent', label: 'Neurodivergent Features' },
  { value: 'premium', label: 'Social Media Suite (Premium)' },
  { value: 'customization', label: 'Customization Features' }
];

// Helper to get icon component by name string
const getIcon = (name) => {
  const icons = { Star, Heart, Users, Zap, Award, Smile, ThumbsUp, Activity, Sun, Moon, Cloud, Search, Filter, Settings, Check, X };
  return icons[name] || Star;
};

export default function AdminHomepageFeatures() {
  const queryClient = useQueryClient();
  const [editingFeature, setEditingFeature] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('free');

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['homepageFeatures'],
    queryFn: () => base44.entities.HomepageFeature.list('sort_order'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        sort_order: Number(data.sort_order || 0)
      };

      if (editingFeature?.id) {
        return await base44.entities.HomepageFeature.update(editingFeature.id, payload);
      } else {
        return await base44.entities.HomepageFeature.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageFeatures'] });
      setIsDialogOpen(false);
      setEditingFeature(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomepageFeature.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['homepageFeatures'] }),
  });

  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingFeature({
      title: '',
      description: '',
      icon: 'Star',
      section: selectedSection,
      color: 'from-purple-500 to-indigo-500',
      sort_order: features.filter(f => f.section === selectedSection).length + 1,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const filteredFeatures = features.filter(f => f.section === selectedSection);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Homepage Features</h2>
          <p className="text-sm text-gray-500">Manage the content boxes on the landing page</p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        {SECTIONS.map(section => (
          <button
            key={section.value}
            onClick={() => setSelectedSection(section.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedSection === section.value 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFeatures.map((feature) => {
          const Icon = getIcon(feature.icon);
          return (
            <Card key={feature.id} className={`relative ${!feature.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
              <CardHeader className="pb-2 flex flex-row items-start space-y-0 gap-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{feature.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{feature.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(feature)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                    if (confirm('Are you sure?')) deleteMutation.mutate(feature.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredFeatures.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
            No features in this section yet.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFeature?.id ? 'Edit Feature' : 'Add Feature'}</DialogTitle>
          </DialogHeader>
          
          {editingFeature && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={editingFeature.title} 
                  onChange={(e) => setEditingFeature({...editingFeature, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingFeature.description} 
                  onChange={(e) => setEditingFeature({...editingFeature, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select 
                    value={editingFeature.section} 
                    onValueChange={(v) => setEditingFeature({...editingFeature, section: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input 
                    type="number" 
                    value={editingFeature.sort_order} 
                    onChange={(e) => setEditingFeature({...editingFeature, sort_order: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon Name</Label>
                  <Input 
                    value={editingFeature.icon} 
                    onChange={(e) => setEditingFeature({...editingFeature, icon: e.target.value})}
                    placeholder="e.g. Star, Heart, Users"
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    Preview: {React.createElement(getIcon(editingFeature.icon), { className: "w-4 h-4" })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gradient Color (Tailwind)</Label>
                  <Input 
                    value={editingFeature.color} 
                    onChange={(e) => setEditingFeature({...editingFeature, color: e.target.value})}
                    placeholder="from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label>Active Status</Label>
                <Switch 
                  checked={editingFeature.is_active} 
                  onCheckedChange={(c) => setEditingFeature({...editingFeature, is_active: c})}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(editingFeature)} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}