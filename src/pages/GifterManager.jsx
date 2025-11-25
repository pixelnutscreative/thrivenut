import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData, formatGifterListForEmail } from '../components/gifter/useGifterSharing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, User, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GifterManager() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGifter, setEditingGifter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    screen_name: '',
    phonetic: ''
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

  const { data: gifters = [], isLoading } = useQuery({
    queryKey: ['gifters'],
    queryFn: () => base44.entities.Gifter.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gifter.create(data),
    onSuccess: async (newGifter) => {
      queryClient.invalidateQueries({ queryKey: ['gifters'] });
      resetForm();
      // Auto-share
      await shareGifterData(
        preferences,
        '🎁 New Gifter Added',
        `A new gifter was added:\n\n• ${newGifter.screen_name} (@${newGifter.username})${newGifter.phonetic ? ` - "${newGifter.phonetic}"` : ''}\n\n---\nFrom ThriveNut Gifter Manager`
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gifter.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['gifters'] });
      resetForm();
      // Auto-share
      await shareGifterData(
        preferences,
        '🎁 Gifter Updated',
        `A gifter was updated:\n\n• ${formData.screen_name} (@${formData.username})${formData.phonetic ? ` - "${formData.phonetic}"` : ''}\n\n---\nFrom ThriveNut Gifter Manager`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Gifter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifters'] });
    },
  });

  const resetForm = () => {
    setFormData({ username: '', screen_name: '', phonetic: '' });
    setEditingGifter(null);
    setShowModal(false);
  };

  const handleEdit = (gifter) => {
    setEditingGifter(gifter);
    setFormData({
      username: gifter.username,
      screen_name: gifter.screen_name,
      phonetic: gifter.phonetic || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const cleanUsername = formData.username.replace('@', '').trim();
    const submitData = { ...formData, username: cleanUsername };

    // Check for existing gifter with same username (only for new gifters)
    if (!editingGifter) {
      const existing = gifters.find(g => g.username.toLowerCase() === cleanUsername.toLowerCase());
      if (existing) {
        alert(`A gifter with username @${cleanUsername} already exists!`);
        return;
      }
    }

    if (editingGifter) {
      updateMutation.mutate({ id: editingGifter.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredGifters = gifters.filter(g =>
    g.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.screen_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gifter Manager</h1>
            <p className="text-gray-600 mt-1">Manage your top gifters for thank-you songs</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Gifter
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search gifters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Gifter List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredGifters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No gifters found. Add your first gifter!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredGifters.map((gifter, index) => (
              <motion.div
                key={gifter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{gifter.screen_name}</h3>
                        <p className="text-purple-600">@{gifter.username}</p>
                        {gifter.phonetic && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            🎵 "{gifter.phonetic}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(gifter)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this gifter?')) {
                              deleteMutation.mutate(gifter.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGifter ? 'Edit Gifter' : 'Add New Gifter'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Screen Name *</Label>
              <Input
                placeholder="e.g., Sheri D"
                value={formData.screen_name}
                onChange={(e) => setFormData({ ...formData, screen_name: e.target.value })}
              />
              <p className="text-xs text-gray-500">What you see on screen during lives</p>
            </div>

            <div className="space-y-2">
              <Label>TikTok Username *</Label>
              <Input
                placeholder="e.g., @SheriD777"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Phonetic Pronunciation</Label>
              <Input
                placeholder="e.g., Sheri Dee Seven Seven Seven"
                value={formData.phonetic}
                onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
              />
              <p className="text-xs text-gray-500">How to pronounce for the song</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.screen_name || !formData.username || createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingGifter ? 'Update' : 'Add'} Gifter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}