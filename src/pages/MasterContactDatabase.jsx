import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { 
  Search, Edit, Save, X, Users, Lock, Unlock, UserCheck, Music, Check, Trash2, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export default function MasterContactDatabase() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUsername, setEditingUsername] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', display_name: '', phonetic: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';

  // Load ALL contacts from ALL users
  const { data: allContacts = [], isLoading } = useQuery({
    queryKey: ['masterContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 2000),
  });

  // Group contacts by username to show consolidated view (one entry per username)
  const consolidatedContacts = React.useMemo(() => {
    const byUsername = {};
    
    allContacts.forEach(contact => {
      const username = (contact.data?.username || contact.username || '').toLowerCase().replace('@', '').trim();
      if (!username) return;
      
      const displayName = contact.data?.display_name || contact.display_name || '';
      const phonetic = contact.data?.phonetic || contact.phonetic || '';
      const owner = contact.data?.created_by || contact.created_by;
      const isGifter = contact.data?.is_gifter || contact.is_gifter;
      const giftedFor = contact.data?.gifted_for || contact.gifted_for || [];
      
      if (!byUsername[username]) {
        byUsername[username] = {
          username,
          display_name: displayName,
          phonetic: phonetic,
          owners: owner ? [owner] : [],
          contactIds: [contact.id],
          is_gifter: isGifter,
          gifted_for: [...giftedFor]
        };
      } else {
        // Already exists - merge data, prefer non-empty values
        if (!byUsername[username].display_name && displayName) {
          byUsername[username].display_name = displayName;
        }
        if (!byUsername[username].phonetic && phonetic) {
          byUsername[username].phonetic = phonetic;
        }
        if (owner && !byUsername[username].owners.includes(owner)) {
          byUsername[username].owners.push(owner);
        }
        byUsername[username].contactIds.push(contact.id);
        if (isGifter) {
          byUsername[username].is_gifter = true;
        }
        // Merge gifted_for arrays (unique values only)
        giftedFor.forEach(gf => {
          if (!byUsername[username].gifted_for.includes(gf)) {
            byUsername[username].gifted_for.push(gf);
          }
        });
      }
    });
    
    return Object.values(byUsername).sort((a, b) => a.username.localeCompare(b.username));
  }, [allContacts]);

  // Filter by search
  const filteredContacts = consolidatedContacts.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phonetic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if current user can edit a contact
  const canEdit = (contact) => {
    if (isAdmin) return true;
    if (!user?.email) return false;
    return contact.owners.includes(user.email);
  };

  // Update mutation - updates ONLY the shared fields (username, display_name, phonetic) across all users
  const updateMutation = useMutation({
    mutationFn: async ({ originalUsername, data }) => {
      // Find all contacts with this username and update ONLY the shared fields
      const contactsToUpdate = allContacts.filter(c => {
        const cUsername = (c.data?.username || c.username || '').toLowerCase().replace('@', '').trim();
        return cUsername === originalUsername.toLowerCase();
      });
      
      // Only update the shared fields, leave private data (phone, email, notes, etc.) untouched
      const sharedData = {
        username: data.username,
        display_name: data.display_name,
        phonetic: data.phonetic
      };
      
      const promises = contactsToUpdate.map(contact => 
        base44.entities.TikTokContact.update(contact.id, sharedData)
      );
      
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      // Mark this contact as saved temporarily
      queryClient.setQueryData(['masterContacts'], (old) => {
        if (!old) return old;
        return old.map(c => {
          const cUsername = (c.data?.username || c.username || '').toLowerCase().replace('@', '').trim();
          if (cUsername === variables.originalUsername.toLowerCase()) {
            return { ...c, _saved: true };
          }
          return c;
        });
      });
      
      // Clear saved state after 2 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['masterContacts'] });
      }, 2000);
      
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
      setEditingUsername(null);
    },
  });

  const handleEdit = (contact) => {
    if (!canEdit(contact)) return;
    setEditingUsername(contact.username);
    setEditForm({
      username: contact.username || '',
      display_name: contact.display_name || '',
      phonetic: contact.phonetic || ''
    });
  };

  const handleSave = (originalUsername) => {
    updateMutation.mutate({
      originalUsername,
      data: {
        username: editForm.username.replace('@', '').trim(),
        display_name: editForm.display_name,
        phonetic: editForm.phonetic
      }
    });
  };

  const handleCancel = () => {
    setEditingUsername(null);
  };

  // Delete mutation - deletes ALL contacts with this username across all users (admin only)
  const deleteMutation = useMutation({
    mutationFn: async (username) => {
      const contactsToDelete = allContacts.filter(c => {
        const cUsername = (c.data?.username || c.username || '').toLowerCase().replace('@', '').trim();
        return cUsername === username.toLowerCase();
      });
      
      const promises = contactsToDelete.map(contact => 
        base44.entities.TikTokContact.delete(contact.id)
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterContacts'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
      setDeleteConfirm(null);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Master Contact Database
          </h1>
          <p className="text-gray-600 mt-1">
            Only username, display name, and phonetic are shared across all users. Phone, email, and other data remain private to each user.
            {isAdmin ? (
              <Badge className="ml-2 bg-amber-100 text-amber-800">Admin - Full Access</Badge>
            ) : (
              <span className="text-sm text-gray-500 ml-2">You can only edit contacts you created.</span>
            )}
          </p>
        </div>

        {/* Search + Save */}
        <Card className="sticky top-0 z-10 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by username, display name, or phonetic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {editingUsername && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSave(editingUsername)}
                    disabled={updateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {filteredContacts.length} contacts in master database
            </p>
          </CardContent>
        </Card>

        {/* Contacts List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All TikTok Contacts</CardTitle>
            <CardDescription>
              When AI imports screenshots, it matches usernames here to auto-fill display names and phonetics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Loading contacts...</p>
            ) : filteredContacts.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No contacts found</p>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact, index) => {
                  const editable = canEdit(contact);
                  const localEdit = editingUsername === contact.username ? editForm : null;
                  const isSaved = contact._saved;
                  
                  return (
                    <motion.div
                      key={contact.username}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSaved ? 'bg-green-50 border-green-400' : editable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Lock icon for non-editable */}
                        <div className="col-span-1 flex justify-center">
                          {!editable && (
                            <Lock className="w-4 h-4 text-gray-300" title="You don't have permission to edit" />
                          )}
                        </div>
                        
                        {/* Username field - 3 cols */}
                        <div className="col-span-3">
                          {editable ? (
                            <Input
                              value={localEdit?.username ?? contact.username}
                              onChange={(e) => {
                                if (!localEdit) handleEdit(contact);
                                setEditForm(prev => ({ ...prev, username: e.target.value }));
                              }}
                              onFocus={() => { if (!localEdit) handleEdit(contact); }}
                              placeholder="@username"
                              className="h-8 text-sm font-mono w-full"
                            />
                          ) : (
                            <p className="font-mono text-sm font-semibold text-purple-700 truncate">@{contact.username}</p>
                          )}
                        </div>
                        
                        {/* Display name field - 3 cols */}
                        <div className="col-span-3">
                          {editable ? (
                            <Input
                              value={localEdit?.display_name ?? contact.display_name ?? ''}
                              onChange={(e) => {
                                if (!localEdit) handleEdit(contact);
                                setEditForm(prev => ({ ...prev, display_name: e.target.value }));
                              }}
                              onFocus={() => { if (!localEdit) handleEdit(contact); }}
                              placeholder="Display name"
                              className="h-8 w-full"
                            />
                          ) : (
                            <p className="truncate">{contact.display_name || <span className="text-gray-400 italic">No display name</span>}</p>
                          )}
                        </div>
                        
                        {/* Phonetic field - 3 cols */}
                        <div className="col-span-3">
                          {editable ? (
                            <Input
                              value={localEdit?.phonetic ?? contact.phonetic ?? ''}
                              onChange={(e) => {
                                if (!localEdit) handleEdit(contact);
                                setEditForm(prev => ({ ...prev, phonetic: e.target.value }));
                              }}
                              onFocus={() => { if (!localEdit) handleEdit(contact); }}
                              placeholder="Phonetic 🎵"
                              className="h-8 w-full"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 truncate">
                              {contact.phonetic || <span className="text-gray-400 italic">No phonetic</span>}
                            </p>
                          )}
                        </div>
                        
                        {/* Badges + Delete - 2 cols */}
                        <div className="col-span-2 flex items-center justify-end gap-1 flex-wrap">
                          {contact.gifted_for?.length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700" title={`Gifted for: ${contact.gifted_for.map(u => '@' + u).join(', ')}`}>
                              🎁 {contact.gifted_for.length}
                            </Badge>
                          )}
                          {contact.is_gifter && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Gifter</Badge>
                          )}
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {contact.owners.length} user{contact.owners.length !== 1 ? 's' : ''}
                          </Badge>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteConfirm(contact)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete from all users"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Contact from All Users?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              This will permanently delete <strong>@{deleteConfirm?.username}</strong> from the master database 
              and remove it from <strong>{deleteConfirm?.owners?.length || 0} user(s)</strong>.
            </p>
            <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate(deleteConfirm?.username)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Delete from All Users</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}