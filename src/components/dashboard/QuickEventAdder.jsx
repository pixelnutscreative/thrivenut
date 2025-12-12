import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, UserPlus, Swords, Video } from 'lucide-react';
import { getEffectiveUserEmail } from '../admin/ImpersonationBanner';

export default function QuickEventAdder({ isOpen, onClose, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    platform: 'TikTok',
    host_username: '',
    link: '',
    notes: '',
    is_urgent: true
  });
  const [searchUsername, setSearchUsername] = useState('');
  const [showCreateContact, setShowCreateContact] = useState(false);

  const effectiveEmail = getEffectiveUserEmail(userEmail);

  // Search contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail && isOpen,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.ExternalEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalEvents'] });
      setFormData({ title: '', date: '', time: '', platform: 'TikTok', host_username: '', link: '', notes: '', is_urgent: true });
      setSearchUsername('');
      onClose();
    }
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setShowCreateContact(false);
    }
  });

  const handleSearchSelect = (username) => {
    setFormData({ ...formData, host_username: username, link: `https://tiktok.com/@${username}` });
    setSearchUsername('');
  };

  const handleCreateContact = () => {
    if (!searchUsername.trim()) return;
    const cleanUsername = searchUsername.replace('@', '').trim();
    createContactMutation.mutate({
      username: cleanUsername,
      display_name: cleanUsername,
      calendar_enabled: true
    });
    handleSearchSelect(cleanUsername);
  };

  const filteredContacts = contacts.filter(c => 
    c.username?.toLowerCase().includes(searchUsername.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchUsername.toLowerCase())
  );

  const handleSubmit = () => {
    createEventMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Quick Add Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Event Name *</Label>
            <Input
              placeholder="e.g., Pixel's Battle, AI Training Class"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Discord">Discord</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Zoom">Zoom</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Host/Creator Username</Label>
            <div className="relative">
              <Input
                placeholder="Type to search contacts or add new..."
                value={searchUsername || formData.host_username}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              {searchUsername && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSearchSelect(c.username)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2"
                      >
                        <span className="font-medium">@{c.username}</span>
                        {c.display_name && <span className="text-sm text-gray-500">{c.display_name}</span>}
                      </button>
                    ))
                  ) : (
                    <div className="p-3">
                      <p className="text-sm text-gray-500 mb-2">Not in your contacts yet</p>
                      <Button
                        size="sm"
                        onClick={handleCreateContact}
                        disabled={createContactMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <UserPlus className="w-3 h-3 mr-2" />
                        Add @{searchUsername.replace('@', '')} to Contacts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event Link (optional)</Label>
            <Input
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <input
              type="checkbox"
              checked={formData.is_urgent}
              onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
              className="w-4 h-4"
            />
            <div>
              <p className="font-medium text-red-800 text-sm">🔥 Mark as Urgent/Important</p>
              <p className="text-xs text-red-600">Show prominently on dashboard to not miss it</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.date || !formData.time || createEventMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {createEventMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}