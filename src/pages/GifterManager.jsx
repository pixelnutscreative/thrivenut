import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData, formatGifterListForEmail } from '../components/gifter/useGifterSharing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, User, Loader2, Search, UserPlus, Gift, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GifterManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ display_name: '', phonetic: '' });

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

  // Fetch contacts marked as gifters
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const gifters = contacts.filter(c => c.is_gifter);

  // Find duplicates by username
  const duplicates = gifters.reduce((acc, g) => {
    const key = g.username?.toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});
  const duplicateUsernames = Object.entries(duplicates)
    .filter(([_, arr]) => arr.length > 1)
    .map(([username]) => username);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const startEditing = (gifter) => {
    setEditingId(gifter.id);
    setEditForm({
      display_name: gifter.display_name || gifter.screen_name || '',
      phonetic: gifter.phonetic || ''
    });
  };

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const filteredGifters = gifters.filter(g =>
    g.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.screen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gifter Manager</h1>
            <p className="text-gray-600 mt-1">Your gifters for thank-you songs</p>
          </div>
          <Link to={createPageUrl('TikTokContacts')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-medium text-gray-800">Gifters are now managed from TikTok Contacts</p>
                <p className="text-sm text-gray-600">Add contacts and enable "Gifter" to track them here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Warning */}
        {duplicateUsernames.length > 0 && (
          <Alert className="bg-amber-50 border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Duplicate gifters found:</strong> {duplicateUsernames.map(u => `@${u}`).join(', ')}
              <span className="block text-sm mt-1">Consider removing duplicates to avoid confusion.</span>
            </AlertDescription>
          </Alert>
        )}

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
              <p className="text-gray-500 mb-4">No gifters found.</p>
              <Link to={createPageUrl('TikTokContacts')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gifters in Contacts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredGifters.map((gifter, index) => {
              const isDuplicate = duplicateUsernames.includes(gifter.username?.toLowerCase());
              const isEditing = editingId === gifter.id;
              
              return (
                <motion.div
                  key={gifter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`hover:shadow-lg transition-shadow ${isDuplicate ? 'border-amber-400 bg-amber-50/50' : ''}`}>
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-medium">@{gifter.username}</span>
                            {isDuplicate && (
                              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Duplicate</span>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Display Name</Label>
                              <Input
                                value={editForm.display_name}
                                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                placeholder="Screen name for songs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Phonetic 🎵</Label>
                              <Input
                                value={editForm.phonetic}
                                onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
                                placeholder="How to pronounce"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(gifter.id)}
                              disabled={updateMutation.isPending}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                            {isDuplicate && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 ml-auto"
                                onClick={() => {
                                  if (confirm('Delete this duplicate gifter?')) {
                                    deleteMutation.mutate(gifter.id);
                                  }
                                }}
                              >
                                Delete Duplicate
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{gifter.display_name || gifter.screen_name || gifter.username}</h3>
                              {isDuplicate && (
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Duplicate</span>
                              )}
                            </div>
                            <p className="text-purple-600">@{gifter.username}</p>
                            {gifter.phonetic ? (
                              <p className="text-sm text-gray-500 italic mt-1">
                                🎵 "{gifter.phonetic}"
                              </p>
                            ) : (
                              <p className="text-sm text-amber-600 mt-1">
                                ⚠️ No phonetic set
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditing(gifter)}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}