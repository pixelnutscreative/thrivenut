import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast'; // Assuming toast exists
import { Loader2, Plus, Save, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TikTokContacts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: async () => {
      // Fetch all contacts or filter by user if needed. 
      // Assuming we want to see all contacts created by the user or relevant ones.
      // Since it's "Creator Contacts", maybe it's a personal address book?
      // Or maybe it's a public directory?
      // Using .list() for now, which respects RLS (usually user's own data or public).
      return await base44.entities.TikTokContact.list('-updated_date', 100);
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiktokContacts']);
      setIsDialogOpen(false);
      setEditingContact(null);
      toast({ title: 'Success', description: 'Contact created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create contact: ' + error.message, variant: 'destructive' });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiktokContacts']);
      setIsDialogOpen(false);
      setEditingContact(null);
      toast({ title: 'Success', description: 'Contact updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update contact: ' + error.message, variant: 'destructive' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiktokContacts']);
      toast({ title: 'Success', description: 'Contact deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete contact: ' + error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      username: formData.get('username'),
      display_name: formData.get('display_name'),
      notes: formData.get('notes'),
      role: formData.get('role') ? formData.get('role').split(',').map(r => r.trim()) : [],
      // Add other fields as needed based on schema
    };

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEdit = (contact) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingContact(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">Creator Contacts</h1>
          <p className="text-gray-500 mt-1">Manage your TikTok connections</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Add Contact
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search creators..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-start">
                  <div className="truncate">
                    <div className="font-bold text-lg">{contact.display_name || contact.username}</div>
                    <div className="text-sm text-gray-500 font-normal">@{contact.username}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact.notes && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{contact.notes}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(contact)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" size="icon" onClick={() => {
                    if(confirm('Delete this contact?')) deleteMutation.mutate(contact.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="tiktok_user" 
                  className="pl-8" 
                  defaultValue={editingContact?.username} 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input 
                id="display_name" 
                name="display_name" 
                placeholder="Name" 
                defaultValue={editingContact?.display_name} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Roles (comma separated)</Label>
              <Input 
                id="role" 
                name="role" 
                placeholder="Creator, Gifter, Mod" 
                defaultValue={editingContact?.role?.join(', ')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Add some notes..." 
                defaultValue={editingContact?.notes} 
                className="h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Contact
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}