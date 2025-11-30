import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Upload, Palette, GripVertical, X } from 'lucide-react';

export default function AdminNutPalsContent() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', images: [], sort_order: 100, is_active: true });
  const [uploading, setUploading] = useState(false);

  const { data: nutpals = [], isLoading } = useQuery({
    queryKey: ['adminNutpals'],
    queryFn: () => base44.entities.NutPalStyle.list('sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NutPalStyle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNutpals'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutPalStyle.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNutpals'] });
      setEditingItem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NutPalStyle.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminNutpals'] })
  });

  const resetForm = () => {
    setFormData({ name: '', images: [], sort_order: 100, is_active: true });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newImages = [...formData.images];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newImages.push(file_url);
    }

    setFormData({ ...formData, images: newImages });
    setUploading(false);
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      images: item.images || [],
      sort_order: item.sort_order || 100,
      is_active: item.is_active !== false
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">NutPals Gallery</h2>
          <p className="text-gray-600 text-sm">Manage your 50+ NutPal character styles</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Add NutPal Style
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nutpals.map((nutpal) => (
          <Card 
            key={nutpal.id} 
            className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${!nutpal.is_active ? 'opacity-50' : ''}`}
            onClick={() => openEdit(nutpal)}
          >
            <div className="aspect-square bg-gradient-to-br from-teal-100 to-cyan-100 relative">
              {nutpal.images?.length > 0 ? (
                <img src={nutpal.images[0]} alt={nutpal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Palette className="w-16 h-16 text-teal-300" />
                </div>
              )}
              {nutpal.images?.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  +{nutpal.images.length - 1} more
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold text-gray-800 truncate">{nutpal.name}</h3>
              <p className="text-xs text-gray-500">Order: {nutpal.sort_order}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {nutpals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No NutPal styles yet. Add your first one!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || !!editingItem} onOpenChange={(open) => { if (!open) { setShowAddModal(false); setEditingItem(null); resetForm(); }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit NutPal Style' : 'Add NutPal Style'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g., Squirrel Sam, Designer Bag Diva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 100 })}
              />
            </div>

            <div>
              <Label>Images (multiple allowed per style)</Label>
              <div className="mt-2 space-y-3">
                {/* Image Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Images</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label>Active (show in carousel)</Label>
            </div>

            <div className="flex gap-3 pt-4">
              {editingItem && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this NutPal style?')) {
                      deleteMutation.mutate(editingItem.id);
                      setEditingItem(null);
                      resetForm();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Add NutPal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}