import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Trash2, Users, ExternalLink } from 'lucide-react';

export default function AdminMasterContactsContent() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: allContacts = [] } = useQuery({
    queryKey: ['allMasterContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 2000),
  });

  // Consolidate by username
  const consolidated = {};
  allContacts.forEach(contact => {
    const username = (contact.username || '').toLowerCase();
    if (!username) return;
    if (!consolidated[username]) {
      consolidated[username] = {
        username,
        display_name: contact.display_name,
        phonetic: contact.phonetic,
        entries: [],
        owners: new Set()
      };
    }
    consolidated[username].entries.push(contact);
    if (contact.created_by) consolidated[username].owners.add(contact.created_by);
    if (!consolidated[username].display_name && contact.display_name) consolidated[username].display_name = contact.display_name;
    if (!consolidated[username].phonetic && contact.phonetic) consolidated[username].phonetic = contact.phonetic;
  });

  const contactList = Object.values(consolidated).sort((a, b) => a.username.localeCompare(b.username));
  const filteredContacts = contactList.filter(c => 
    !searchTerm || 
    c.username.includes(searchTerm.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateMutation = useMutation({
    mutationFn: async ({ username, field, value }) => {
      const entries = consolidated[username]?.entries || [];
      for (const entry of entries) {
        await base44.entities.TikTokContact.update(entry.id, { [field]: value });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allMasterContacts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (username) => {
      const entries = consolidated[username]?.entries || [];
      for (const entry of entries) {
        await base44.entities.TikTokContact.delete(entry.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMasterContacts'] });
      setDeleteConfirm(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <p className="text-sm text-gray-600">{filteredContacts.length} unique contacts across all users</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
        {filteredContacts.map(contact => (
          <Card key={contact.username} className="relative group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-purple-600 cursor-pointer hover:underline" onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}>
                    @{contact.username} <ExternalLink className="w-3 h-3 inline" />
                  </p>
                  <Input
                    value={contact.display_name || ''}
                    onChange={(e) => updateMutation.mutate({ username: contact.username, field: 'display_name', value: e.target.value })}
                    placeholder="Display name"
                    className="mt-2 h-8 text-sm"
                  />
                  <Input
                    value={contact.phonetic || ''}
                    onChange={(e) => updateMutation.mutate({ username: contact.username, field: 'phonetic', value: e.target.value })}
                    placeholder="Phonetic"
                    className="mt-1 h-8 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">{contact.owners.size} user(s)</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(contact.username)} className="opacity-0 group-hover:opacity-100 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete @{deleteConfirm}?</DialogTitle></DialogHeader>
          <p className="text-gray-600">This will delete this contact from ALL users who have it.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm)}>Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}