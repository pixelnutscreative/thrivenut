import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData } from '../components/gifter/useGifterSharing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Gift, Loader2, Upload, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GiftLibrary() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    league_range: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: gifts = [], isLoading } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gift.create(data),
    onSuccess: async (newGift) => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      resetForm();
      await shareGifterData(
        preferences,
        '🎁 New Gift Added to Library',
        `A new gift was added:\n\n• ${newGift.name}${newGift.league_range ? ` (${newGift.league_range})` : ''}\n\n---\nFrom ThriveNut Gift Library`
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gift.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      resetForm();
      await shareGifterData(
        preferences,
        '🎁 Gift Updated in Library',
        `A gift was updated:\n\n• ${formData.name}${formData.league_range ? ` (${formData.league_range})` : ''}\n\n---\nFrom ThriveNut Gift Library`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Gift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', image_url: '', league_range: '' });
    setEditingGift(null);
    setShowModal(false);
  };

  const handleEdit = (gift) => {
    setEditingGift(gift);
    setFormData({
      name: gift.name,
      image_url: gift.image_url || '',
      league_range: gift.league_range || ''
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    if (editingGift) {
      updateMutation.mutate({ id: editingGift.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredGifts = gifts.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.league_range || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by league range
  const giftsByLeague = filteredGifts.reduce((acc, gift) => {
    const league = gift.league_range || 'No League';
    if (!acc[league]) acc[league] = [];
    acc[league].push(gift);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gift Library</h1>
            <p className="text-gray-600 mt-1">All TikTok gifts by league</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Gift
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search gifts or leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Gift List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : Object.keys(giftsByLeague).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No gifts found. Add your first gift!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(giftsByLeague).sort().map(([league, leagueGifts]) => (
              <div key={league}>
                <h2 className="text-xl font-bold text-gray-700 mb-3">{league}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {leagueGifts.map((gift, index) => (
                    <motion.div
                      key={gift.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow group relative">
                        <CardContent className="p-4 text-center">
                          {gift.image_url ? (
                            <img
                              src={gift.image_url}
                              alt={gift.name}
                              className="w-16 h-16 mx-auto object-contain mb-2"
                            />
                          ) : (
                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-2">
                              <Gift className="w-8 h-8 text-purple-400" />
                            </div>
                          )}
                          <p className="font-semibold text-sm truncate">{gift.name}</p>
                          
                          {/* Hover actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEdit(gift)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => {
                                if (confirm('Delete this gift?')) {
                                  deleteMutation.mutate(gift.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGift ? 'Edit Gift' : 'Add New Gift'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gift Name *</Label>
              <Input
                placeholder="e.g., Lion, Galaxy, Crown"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>League Range</Label>
              <Input
                placeholder="e.g., A1-A3, B2-B5"
                value={formData.league_range}
                onChange={(e) => setFormData({ ...formData, league_range: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Gift Image (Optional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('gift-image-upload').click()}
                  disabled={uploadingImage}
                  className="w-full"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {formData.image_url ? 'Change Image' : 'Upload Image'}
                </Button>
                <input
                  id="gift-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Gift preview"
                  className="w-20 h-20 object-contain mx-auto mt-2"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingGift ? 'Update' : 'Add'} Gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}