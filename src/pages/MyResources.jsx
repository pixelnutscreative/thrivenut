import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search, ExternalLink, Trash2, Filter, Link as LinkIcon, Edit2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

const defaultCategories = ['Courses', 'Communities', 'Tools', 'Inspiration', 'Reading', 'Watch Later', 'Other'];

export default function MyResources() {
  const queryClient = useQueryClient();
  const { user, preferences } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Other',
    notes: '',
    tags: []
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['myResources', user?.email],
    queryFn: () => base44.entities.UserResource.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email
  });

  const { data: userCategories = [] } = useQuery({
    queryKey: ['myResourceCategories', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.entities.UserResource.filter({ user_email: user.email });
      const cats = new Set(res.map(r => r.category).filter(Boolean));
      return [...cats];
    },
    enabled: !!user?.email
  });

  const allCategories = [...new Set([...defaultCategories, ...userCategories])];

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingItem) {
        return await base44.entities.UserResource.update(editingItem.id, data);
      }
      return await base44.entities.UserResource.create({
        ...data,
        user_email: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResources'] });
      setIsAddOpen(false);
      setEditingItem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserResource.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myResources'] })
  });

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      category: 'Other',
      notes: '',
      tags: []
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      url: item.url,
      category: item.category,
      notes: item.notes,
      tags: item.tags || []
    });
    setIsAddOpen(true);
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = !search || 
      res.title.toLowerCase().includes(search.toLowerCase()) || 
      res.notes?.toLowerCase().includes(search.toLowerCase()) ||
      res.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-purple-600" />
            {preferences?.my_resources_label || 'My Stuff'}
          </h1>
          <p className="text-gray-600">Your personal library of links, courses, and inspiration.</p>
        </div>
        <div className="flex gap-2">
          {/* Rename Button */}
          <Button variant="outline" size="sm" onClick={() => {
            const newName = prompt('Rename "My Stuff" to:', preferences?.my_resources_label || 'My Stuff');
            if (newName && newName.trim()) {
              base44.entities.UserPreferences.update(preferences.id, { my_resources_label: newName.trim() })
                .then(() => window.location.reload()); 
            }
          }}>
            <Edit2 className="w-4 h-4 mr-2" /> Rename
          </Button>
          <Button onClick={() => { setEditingItem(null); resetForm(); setIsAddOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search resources..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {allCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow group relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">{resource.category}</Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEdit(resource)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => deleteMutation.mutate(resource.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {resource.url ? (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-purple-600 flex gap-2 items-start">
                      {resource.title}
                      <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0 opacity-50" />
                    </a>
                  ) : (
                    resource.title
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resource.notes && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{resource.notes}</p>}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">#{tag}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredResources.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-500">No resources found. Add your first one!</p>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., My Favorite Course"
              />
            </div>
            <div>
              <Label>URL (Optional)</Label>
              <Input 
                value={formData.url} 
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                 <Input 
                  placeholder="Or type custom category..." 
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Why do you like this? Login info (no passwords!)..."
              />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input 
                value={formData.tags.join(', ')} 
                onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})}
                placeholder="ai, design, recipe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending || !formData.title}>
              {saveMutation.isPending ? 'Saving...' : 'Save Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}