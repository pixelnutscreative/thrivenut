import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Upload, Loader2, Gift } from 'lucide-react';

export default function AdminGiftLibraryContent() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', image_url: '', league_range: '', coin_value: 0 });
  const [uploading, setUploading] = useState(false);

  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gift.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gifts'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gift.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gifts'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Gift.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gifts'] }),
  });

  const resetForm = () => {
    setFormData({ name: '', image_url: '', league_range: '', coin_value: 0 });
    setEditingGift(null);
    setShowModal(false);
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({ name: gift.name, image_url: gift.image_url || '', league_range: gift.league_range || '', coin_value: gift.coin_value || 0 });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (editingGift) {
      updateMutation.mutate({ id: editingGift.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredGifts = gifts.filter(g => !searchTerm || g.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search gifts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Add Gift
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredGifts.map(gift => (
          <Card key={gift.id} className="group relative overflow-hidden">
            <CardContent className="p-3 text-center">
              {gift.image_url ? (
                <img src={gift.image_url} alt={gift.name} className="w-16 h-16 mx-auto object-contain" />
              ) : (
                <Gift className="w-16 h-16 mx-auto text-gray-300" />
              )}
              <p className="font-medium text-sm mt-2 truncate">{gift.name}</p>
              {gift.coin_value > 0 && <p className="text-xs text-amber-600">{gift.coin_value} coins</p>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleEdit(gift)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(gift.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); setShowModal(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGift ? 'Edit Gift' : 'Add Gift'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gift Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-3 items-center">
                {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-contain rounded" />}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button asChild variant="outline" disabled={uploading}><span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Upload</span></Button>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>League Range</Label>
                <Input placeholder="e.g., A1-A3" value={formData.league_range} onChange={(e) => setFormData({ ...formData, league_range: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coin Value</Label>
                <Input type="number" value={formData.coin_value} onChange={(e) => setFormData({ ...formData, coin_value: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name} className="bg-purple-600 hover:bg-purple-700">{editingGift ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}