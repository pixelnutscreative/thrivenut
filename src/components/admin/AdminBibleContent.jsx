import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import ImageUploader from '../settings/ImageUploader';

export default function AdminBibleContent() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    download_url: '',
    thumbnail_url: '',
    category: '',
    is_active: true,
    is_free: true,
    sort_order: 100
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['adminBibleResources'],
    queryFn: () => base44.entities.BibleResource.list('sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BibleResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBibleResources'] });
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BibleResource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBibleResources'] });
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BibleResource.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminBibleResources'] })
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      download_url: '',
      thumbnail_url: '',
      category: '',
      is_active: true,
      is_free: true,
      sort_order: 100
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      link: item.link || '',
      download_url: item.download_url || '',
      thumbnail_url: item.thumbnail_url || '',
      category: item.category || '',
      is_active: item.is_active !== false,
      is_free: item.is_free !== false,
      sort_order: item.sort_order || 100
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Bible Resources Manager</h2>
          <p className="text-gray-500">Manage content for the Bible Resources page</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {item.thumbnail_url && (
                        <img src={item.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <div>{item.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {item.is_active ? 'Active' : 'Hidden'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {resources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No resources yet. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Resource' : 'Add Bible Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Study, Kids" />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <ImageUploader 
                currentImage={formData.thumbnail_url} 
                onImageChange={(url) => setFormData({...formData, thumbnail_url: url})}
                label="Upload Cover Image"
              />
            </div>

            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label>Download URL (optional)</Label>
              <Input value={formData.download_url} onChange={(e) => setFormData({...formData, download_url: e.target.value})} placeholder="https://..." />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <Label className="cursor-pointer">Visible to Users</Label>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <Label className="cursor-pointer">Mark as Free</Label>
              <Switch checked={formData.is_free} onCheckedChange={(c) => setFormData({...formData, is_free: c})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}