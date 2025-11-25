import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Trash2, Edit, Star, Phone, Mail, 
  ExternalLink, Users, Swords, Gift, Share2, Heart, UserPlus, Video, Calendar, Music
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
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700' },
  other: { label: 'Other', icon: Users, color: 'bg-gray-100 text-gray-700' }
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const colorOptions = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#6366F1', '#84CC16', '#14B8A6', '#F97316'
];

export default function TikTokContacts() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    screen_name: '',
    phonetic: '',
    phone: '',
    email: '',
    role: [],
    notes: '',
    is_favorite: false,
    engagement_enabled: false,
    engagement_frequency: 'weekly',
    engagement_days: [],
    engagement_category_id: '',
    color: '#8B5CF6',
    calendar_enabled: false,
    is_gifter: false
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['engagementCategories'],
    queryFn: () => base44.entities.EngagementCategory.list('name'),
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
      screen_name: '',
      phonetic: '',
      phone: '',
      email: '',
      role: [],
      notes: '',
      is_favorite: false,
      engagement_enabled: false,
      engagement_frequency: 'weekly',
      engagement_days: [],
      engagement_category_id: '',
      color: '#8B5CF6',
      calendar_enabled: false,
      is_gifter: false
    });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      username: contact.username || '',
      display_name: contact.display_name || '',
      screen_name: contact.screen_name || '',
      phonetic: contact.phonetic || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || [],
      notes: contact.notes || '',
      is_favorite: contact.is_favorite || false,
      engagement_enabled: contact.engagement_enabled || false,
      engagement_frequency: contact.engagement_frequency || 'weekly',
      engagement_days: contact.engagement_days || [],
      engagement_category_id: contact.engagement_category_id || '',
      color: contact.color || '#8B5CF6',
      calendar_enabled: contact.calendar_enabled || false,
      is_gifter: contact.is_gifter || false
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

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      engagement_days: prev.engagement_days.includes(day)
        ? prev.engagement_days.filter(d => d !== day)
        : [...prev.engagement_days, day]
    }));
  };

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = 
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.screen_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || c.role?.includes(filterRole);
      
      // Tab filtering
      if (activeTab === 'engagement') return matchesSearch && matchesRole && c.engagement_enabled;
      if (activeTab === 'calendar') return matchesSearch && matchesRole && c.calendar_enabled;
      if (activeTab === 'gifters') return matchesSearch && matchesRole && c.is_gifter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  const ContactCard = ({ contact, index }) => (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={`relative ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}
        style={{ borderTop: `3px solid ${contact.color || '#8B5CF6'}` }}
      >
        <CardContent className="p-4">
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
              {contact.screen_name && (
                <p className="text-gray-500 text-xs">Screen: {contact.screen_name}</p>
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

            {/* Feature badges */}
            <div className="flex flex-wrap gap-1">
              {contact.engagement_enabled && (
                <Badge variant="outline" className="text-xs bg-purple-50">
                  <Heart className="w-3 h-3 mr-1" /> Engagement
                </Badge>
              )}
              {contact.calendar_enabled && (
                <Badge variant="outline" className="text-xs bg-blue-50">
                  <Calendar className="w-3 h-3 mr-1" /> Calendar
                </Badge>
              )}
              {contact.is_gifter && (
                <Badge variant="outline" className="text-xs bg-amber-50">
                  <Music className="w-3 h-3 mr-1" /> Gifter
                </Badge>
              )}
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

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Profile
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Contacts</h1>
            <p className="text-gray-600 mt-1">Your central hub for all TikTok connections</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({contacts.length})</TabsTrigger>
            <TabsTrigger value="engagement">Engagement ({contacts.filter(c => c.engagement_enabled).length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar ({contacts.filter(c => c.calendar_enabled).length})</TabsTrigger>
            <TabsTrigger value="gifters">Gifters ({contacts.filter(c => c.is_gifter).length})</TabsTrigger>
          </TabsList>
        </Tabs>

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
              <ContactCard key={contact.id} contact={contact} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No contacts found</h3>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add TikTok Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TikTok Username *</Label>
                <Input
                  placeholder="@username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g., Sarah from Texas"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleRole(key)}
                      className={`p-2 rounded-lg border-2 cursor-pointer text-xs ${
                        formData.role.includes(key)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.role.includes(key)} />
                        <Icon className="w-3 h-3" />
                        <span>{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm">Enable Features</h4>
              
              <div
                onClick={() => setFormData({ ...formData, engagement_enabled: !formData.engagement_enabled })}
                className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-white"
              >
                <Checkbox checked={formData.engagement_enabled} />
                <Heart className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium text-sm">Track Engagement</p>
                  <p className="text-xs text-gray-500">Add to engagement tracker</p>
                </div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, calendar_enabled: !formData.calendar_enabled })}
                className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-white"
              >
                <Checkbox checked={formData.calendar_enabled} />
                <Calendar className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Creator Calendar</p>
                  <p className="text-xs text-gray-500">Track their live schedule</p>
                </div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, is_gifter: !formData.is_gifter })}
                className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-white"
              >
                <Checkbox checked={formData.is_gifter} />
                <Gift className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Gifter (for Songs)</p>
                  <p className="text-xs text-gray-500">Generate thank-you songs</p>
                </div>
              </div>
            </div>

            {/* Engagement Settings */}
            {formData.engagement_enabled && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold text-sm">Engagement Settings</h4>
                
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.engagement_frequency} onValueChange={(v) => setFormData({ ...formData, engagement_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="multiple_per_week">Specific Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.engagement_frequency === 'multiple_per_week' && (
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <Badge
                          key={day}
                          variant={formData.engagement_days.includes(day) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.engagement_category_id} onValueChange={(v) => setFormData({ ...formData, engagement_category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Gifter Settings */}
            {formData.is_gifter && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-semibold text-sm">Gifter Settings (for Songs)</h4>
                
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
                  <Label>Phonetic Pronunciation</Label>
                  <Input
                    placeholder="e.g., Sheri Dee Seven Seven Seven"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">How to pronounce for songs</p>
                </div>
              </div>
            )}

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <div
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Notes & Favorite */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any notes..."
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
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.username.trim() || (formData.is_gifter && !formData.screen_name.trim())}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingContact ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}