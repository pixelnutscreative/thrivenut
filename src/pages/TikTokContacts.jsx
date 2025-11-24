import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, Search, Trash2, Edit, Star, Phone, Mail, 
  ExternalLink, Users, Swords, Gift, Share2, Heart, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const roleConfig = {
  battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700' },
  tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  sharer: { label: 'Sharer', icon: Share2, color: 'bg-blue-100 text-blue-700' },
  gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700' },
  supporter: { label: 'Supporter', icon: Heart, color: 'bg-purple-100 text-purple-700' },
  friend: { label: 'Friend', icon: Users, color: 'bg-green-100 text-green-700' },
  collab_partner: { label: 'Collab Partner', icon: UserPlus, color: 'bg-cyan-100 text-cyan-700' },
  other: { label: 'Other', icon: Users, color: 'bg-gray-100 text-gray-700' }
};

export default function TikTokContacts() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    phone: '',
    email: '',
    role: [],
    notes: '',
    is_favorite: false
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const markContactedMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.update(id, { 
      last_contacted: format(new Date(), 'yyyy-MM-dd') 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.TikTokContact.update(id, { 
      is_favorite: !isFavorite 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      username: '',
      display_name: '',
      phone: '',
      email: '',
      role: [],
      notes: '',
      is_favorite: false
    });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      username: contact.username || '',
      display_name: contact.display_name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || [],
      notes: contact.notes || '',
      is_favorite: contact.is_favorite || false
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    const cleanData = {
      ...formData,
      username: formData.username.replace('@', '').trim()
    };
    
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      role: prev.role.includes(role)
        ? prev.role.filter(r => r !== role)
        : [...prev.role, role]
    }));
  };

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = 
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || c.role?.includes(filterRole);
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Favorites first
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Contacts</h1>
            <p className="text-gray-600 mt-1">Keep track of your battle snipers, tappers, gifters & more</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterRole === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterRole('all')}
                >
                  All
                </Badge>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <Badge
                    key={key}
                    variant={filterRole === key ? 'default' : 'outline'}
                    className={`cursor-pointer ${filterRole === key ? '' : config.color}`}
                    onClick={() => setFilterRole(key)}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}>
                  <CardContent className="p-4">
                    {/* Favorite Star */}
                    <button
                      onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite })}
                      className="absolute top-3 right-3"
                    >
                      <Star className={`w-5 h-5 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>

                    <div className="space-y-3">
                      <div>
                        <h3 
                          className="font-bold text-lg cursor-pointer hover:text-purple-600"
                          onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}
                        >
                          @{contact.username}
                        </h3>
                        {contact.display_name && (
                          <p className="text-gray-600 text-sm">{contact.display_name}</p>
                        )}
                      </div>

                      {/* Roles */}
                      <div className="flex flex-wrap gap-1">
                        {contact.role?.map(role => {
                          const config = roleConfig[role];
                          if (!config) return null;
                          const Icon = config.icon;
                          return (
                            <Badge key={role} className={`text-xs ${config.color}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-sm">
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                            <Phone className="w-4 h-4" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </a>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-sm text-gray-500 italic">{contact.notes}</p>
                      )}

                      {contact.last_contacted && (
                        <p className="text-xs text-gray-400">
                          Last contacted: {format(new Date(contact.last_contacted), 'MMM d, yyyy')}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markContactedMutation.mutate(contact.id)}
                        >
                          Mark Contacted
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Delete this contact?')) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No contacts yet</h3>
            <p className="text-gray-500 mb-4">Add your TikTok battle snipers, tappers, and supporters!</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add TikTok Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">TikTok Username *</Label>
              <Input
                id="username"
                placeholder="@username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name / How You Know Them</Label>
              <Input
                id="display_name"
                placeholder="e.g., Sarah from Texas"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Roles (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleRole(key)}
                      className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        formData.role.includes(key)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.role.includes(key)} />
                        <Icon className="w-4 h-4" />
                        <span>{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this person..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
            >
              <Checkbox checked={formData.is_favorite} />
              <Star className={`w-4 h-4 ${formData.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
              <span>Mark as Favorite / VIP</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.username.trim() || createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}