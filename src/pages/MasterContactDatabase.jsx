import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Search, Edit, Save, X, Users, Lock, Unlock, UserCheck, Music
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MasterContactDatabase() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [editForm, setEditForm] = useState({ display_name: '', phonetic: '' });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';

  // Load ALL contacts from ALL users
  const { data: allContacts = [], isLoading } = useQuery({
    queryKey: ['masterContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 2000),
  });

  // Group contacts by username to show consolidated view
  const consolidatedContacts = React.useMemo(() => {
    const byUsername = {};
    
    allContacts.forEach(contact => {
      const username = (contact.data?.username || contact.username || '').toLowerCase().replace('@', '').trim();
      if (!username) return;
      
      if (!byUsername[username]) {
        byUsername[username] = {
          username,
          display_name: contact.data?.display_name || contact.display_name || '',
          phonetic: contact.data?.phonetic || contact.phonetic || '',
          owners: [],
          contactIds: [],
          is_gifter: false
        };
      }
      
      // Collect all owners
      const owner = contact.data?.created_by || contact.created_by;
      if (owner && !byUsername[username].owners.includes(owner)) {
        byUsername[username].owners.push(owner);
      }
      byUsername[username].contactIds.push(contact.id);
      
      // Use the best available display_name and phonetic
      if (!byUsername[username].display_name && (contact.data?.display_name || contact.display_name)) {
        byUsername[username].display_name = contact.data?.display_name || contact.display_name;
      }
      if (!byUsername[username].phonetic && (contact.data?.phonetic || contact.phonetic)) {
        byUsername[username].phonetic = contact.data?.phonetic || contact.phonetic;
      }
      if (contact.data?.is_gifter || contact.is_gifter) {
        byUsername[username].is_gifter = true;
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

  // Update mutation - updates ALL matching contacts across all users
  const updateMutation = useMutation({
    mutationFn: async ({ username, data }) => {
      // Find all contacts with this username and update them
      const contactsToUpdate = allContacts.filter(c => {
        const cUsername = (c.data?.username || c.username || '').toLowerCase().replace('@', '').trim();
        return cUsername === username.toLowerCase();
      });
      
      const promises = contactsToUpdate.map(contact => 
        base44.entities.TikTokContact.update(contact.id, data)
      );
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterContacts'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
      setEditingContact(null);
    },
  });

  const handleEdit = (contact) => {
    if (!canEdit(contact)) return;
    setEditingContact(contact);
    setEditForm({
      display_name: contact.display_name || '',
      phonetic: contact.phonetic || ''
    });
  };

  const handleSave = () => {
    if (!editingContact) return;
    updateMutation.mutate({
      username: editingContact.username,
      data: editForm
    });
  };

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
            Shared display names and phonetics across all users. 
            {isAdmin ? (
              <Badge className="ml-2 bg-amber-100 text-amber-800">Admin - Full Access</Badge>
            ) : (
              <span className="text-sm text-gray-500 ml-2">You can only edit contacts you created.</span>
            )}
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by username, display name, or phonetic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  return (
                    <motion.div
                      key={contact.username}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        editable ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-32">
                          <p className="font-mono text-sm font-semibold text-purple-700">@{contact.username}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{contact.display_name || <span className="text-gray-400 italic">No display name</span>}</p>
                        </div>
                        <div className="flex-1">
                          {contact.phonetic ? (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Music className="w-3 h-3" /> {contact.phonetic}
                            </p>
                          ) : (
                            <span className="text-gray-400 italic text-sm">No phonetic</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.is_gifter && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Gifter</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {contact.owners.length} user{contact.owners.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4">
                        {editable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-300" title="You don't have permission to edit" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit @{editingContact?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="How they appear (e.g., Sarah D)"
              />
            </div>
            <div className="space-y-2">
              <Label>Phonetic Pronunciation 🎵</Label>
              <Input
                value={editForm.phonetic}
                onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
                placeholder="How to say it for songs (e.g., Sarah Dee Seven Seven Seven)"
              />
            </div>
            {isAdmin && editingContact?.owners?.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Owned by:</p>
                <div className="flex flex-wrap gap-1">
                  {editingContact.owners.map(owner => (
                    <Badge key={owner} variant="outline" className="text-xs">{owner}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}